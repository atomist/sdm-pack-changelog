/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    GitCommandGitProject,
    GitHubRepoRef,
    GitProject,
    HandlerResult,
    Success,
    TokenCredentials,
} from "@atomist/automation-client";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import { promisify } from "util";
import { ChangelogLabels } from "../handler/command/changelogLabels";
import {
    ClosedIssueWithChangelogLabel,
    PushWithChangelogLabel,
} from "../typings/types";
import * as parseChangelog from "./changelogParser";

export const ChangelogTemplate = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.0.0]
`;

export interface ChangelogEntry {
    category?: string; // "added" | "changed" | "deprecated" | "removed" | "fixed" | "security";
    title: string;
    label: string;
    url: string;
    qualifiers: string[];
}

/**
 * Add entry to changelog for closed label or pull request
 * @param {ClosedIssueWithChangelogLabel.Issue} issue
 * @param {string} token
 * @returns {Promise<HandlerResult>}
 */
export async function addChangelogEntryForClosedIssue(issue: ClosedIssueWithChangelogLabel.Issue,
                                                      token: string): Promise<HandlerResult> {
    const p = await GitCommandGitProject.cloned(
        { token } as TokenCredentials,
        GitHubRepoRef.from({ owner: issue.repo.owner, repo: issue.repo.name }));

    const url = `https://github.com/${issue.repo.owner}/${issue.repo.name}/issues/${issue.number}`;
    const categories = issue.labels.filter(l => l.name.startsWith("changelog:")).map(l => l.name.split(":")[1]);
    const qualifiers = issue.labels.some(l => l.name.toLocaleLowerCase() === "breaking") ? ["breaking"] : [];
    const entry: ChangelogEntry = {
        title: issue.title,
        label: `#${issue.number.toString()}`,
        url,
        qualifiers,
    };

    await updateChangelog(p, categories, entry);
    return Success;
}

/**
 * Add entry to changelog for commits
 * @param {PushWithChangelogLabel.Push} commit
 * @param {string} token
 * @returns {Promise<HandlerResult>}
 */
export async function addChangelogEntryForCommit(push: PushWithChangelogLabel.Push,
                                                 token: string): Promise<HandlerResult> {
    const p = await GitCommandGitProject.cloned(
        { token } as TokenCredentials,
        GitHubRepoRef.from({ owner: push.repo.owner, repo: push.repo.name, branch: push.branch }));

    for (const commit of push.commits) {
        const categories: string[] = [];
        ChangelogLabels.forEach(l => {
            if (commit.message.toLowerCase().includes(`[changelog:${l}]`)) {
                categories.push(l);
            }
        });

        const entry: ChangelogEntry = {
            title: commit.message.split("\n")[0],
            label: commit.sha.slice(0, 7),
            url: `https://github.com/${push.repo.owner}/${push.repo.name}/commit/${commit.sha}`,
            qualifiers: [],
        };

        if (categories.length > 0) {
            await updateChangelog(p, categories, entry);
        }
    }
    return Success;
}

async function updateChangelog(p: GitProject,
                               categories: string[],
                               entry: ChangelogEntry) {
    const cl = await p.getFile("CHANGELOG.md");
    if (cl) {
        // If changelog exists make sure it doesn't already contain the label
        const content = await cl.getContent();
        if (!content.includes(entry.url)) {
            await updateAndWriteChangelog(p, categories, entry);
        }
    } else {
        await updateAndWriteChangelog(p, categories, entry);
    }

    if (!(await p.isClean())) {
        await p.commit(`Changelog: ${entry.label} to ${categories.join(", ")}

[atomist:generated]`);
        await p.push();
    }
}

async function updateAndWriteChangelog(p: GitProject,
                                       categories: string[],
                                       entry: ChangelogEntry): Promise<any> {
    let changelog = await readChangelog(p);
    for (const category of categories) {
        changelog = addEntryToChangelog({
            ...entry,
            category,
        }
            ,
            changelog,
            p);
    }
    return writeChangelog(changelog, p);
}

/**
 * Read and parse the project changelog.  If the changelog has
 * reference links, this function will rewrite the file with inline
 * links.  If the project does not have a changelog, one will be
 * added.
 *
 * @param p project with changelog file, or not
 * @return an object representing the parsed changelog
 */
export async function readChangelog(p: GitProject): Promise<any> {
    const changelogFile = path.join(p.baseDir, "CHANGELOG.md");

    if (!fs.existsSync(changelogFile)) {
        await fs.writeFile(changelogFile, ChangelogTemplate);
    }

    // Inline links as we would otherwise lose them
    const remark = require("remark");
    const links = require("remark-inline-links");
    const pr = promisify(remark().use(links).process);

    const inlined = await pr(await fs.readFile(changelogFile));
    await fs.writeFile(changelogFile, inlined.contents);

    return parseChangelog(changelogFile);
}

export function addEntryToChangelog(entry: ChangelogEntry,
                                    cl: any,
                                    p: GitProject): any {
    const version = readUnreleasedVersion(cl, p);

    // Add the entry to the correct section
    const category = _.upperFirst(entry.category || "changed");
    const qualifiers = (entry.qualifiers || []).map(q => `**${q.toLocaleUpperCase()}**`).join(" ");
    const title = entry.title.endsWith(".") ? entry.title : `${entry.title}.`;
    const line = `-   ${qualifiers && qualifiers.length > 0 ? `${qualifiers} ` : ""}${title} [${entry.label}](${entry.url})`;
    if (version.parsed[category]) {
        version.parsed[category].push(line);

    } else {
        version.parsed[category] = [line];
    }

    return cl;
}

/**
 * Convert changelog object back to a string.
 *
 * @param changelog parsed changelog object
 * @return markdown formatted changelog file contents
 */
export function changelogToString(changelog: any): string {
    let content = `# ${changelog.title}`;
    if (changelog.description) {
        content = `${content}

${changelog.description}`;
    }

    (changelog.versions || []).filter((v: any) => v.version !== "0.0.0").forEach((v: any) => {
        content += `

## ${v.title}`;

        const keys = Object.keys(v.parsed)
            .filter(k => k !== "_")
            .sort((k1, k2) =>
                ChangelogLabels.indexOf(k1.toLocaleLowerCase()) - ChangelogLabels.indexOf(k2.toLocaleLowerCase()));

        for (const category of keys) {
            content += `

### ${category}

${v.parsed[category].join("\n")}`;
        }

    });

    return content + "\n";
}

/**
 * Write changelog back out to the CHANGELOG.md file
 * @param changelog
 * @param {GitProject} p
 * @returns {Promise<void>}
 */
export async function writeChangelog(changelog: any,
                                     p: GitProject): Promise<void> {
    const content = changelogToString(changelog);
    const changelogFile = path.join(p.baseDir, "CHANGELOG.md");
    return fs.writeFile(changelogFile, content);
}

function readUnreleasedVersion(cl: any, p: GitProject): any {
    let version;
    // Get Unreleased section or create if not already available
    if (cl && cl.versions && cl.versions.length > 0
        // This github.com version is really odd. Not sure what the parser thinks here
        && (!cl.versions[0].version || cl.versions[0].version === "github.com")) {
        version = cl.versions[0];
    } else {
        version = {
            title: `[Unreleased](https://github.com/${p.id.owner}/${p.id.repo}/${
                cl.versions && cl.versions.filter((v: any) => v.version !== "0.0.0").length > 0 ?
                    `compare/${cl.versions[0].version}...HEAD` : "tree/HEAD"})`,
            parsed: {},
        };
        cl.versions = [version, ...cl.versions];
    }
    return version;
}
