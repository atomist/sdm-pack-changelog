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
    ChildProcessResult,
    Failure,
    GitCommandGitProject,
    logger,
    spawnAndWatch,
    SpawnCommand,
    Success,
} from "@atomist/automation-client";
import {
    DelimitedWriteProgressLogDecorator,
    ExecuteGoal,
    ExecuteGoalResult,
    Goal,
    GoalInvocation,
    GoalWithPrecondition,
    ProductionEnvironment,
    ProgressLog,
    ProjectLoader,
} from "@atomist/sdm";
import { readSdmVersion } from "@atomist/sdm-core";
import { SpawnOptions } from "child_process";
import * as semver from "semver";

async function loglog(log: ProgressLog, msg: string): Promise<void> {
    logger.debug(msg);
    log.write(`${msg}\n`);
    await log.flush();
}

function releaseVersion(version: string): string {
    return version.replace(/-.*/, "");
}

type ExecuteLogger = (l: ProgressLog) => Promise<ExecuteGoalResult>;

interface SpawnWatchCommand {
    cmd: SpawnCommand;
    cwd?: string;
}

async function rwlcVersion(gi: GoalInvocation): Promise<string> {
    const version = await readSdmVersion(
        gi.sdmGoal.repo.owner,
        gi.sdmGoal.repo.name,
        gi.sdmGoal.repo.providerId,
        gi.sdmGoal.sha,
        gi.sdmGoal.branch,
        gi.context);
    return version;
}

function releaseOrPreRelease(version: string, gi: GoalInvocation): string {
    const prVersion = preReleaseVersion(gi);
    if (prVersion) {
        return prVersion;
    } else {
        return releaseVersion(version);
    }
}

function preReleaseVersion(gi: GoalInvocation): string | undefined {
    if (gi.sdmGoal.push.after.tags) {
        const tag = gi.sdmGoal.push.after.tags.find(t => {
            const preRelease = semver.prerelease(t.name);
            if (preRelease && ["M", "RC"].includes(preRelease[0])) {
                return true;
            } else {
                return false;
            }
        });
        if (tag) {
            return tag.name;
        }
    }
    return undefined;
}

/**
 * Transform a SpawnWatchCommand into an ExecuteLogger suitable for
 * execution by executeLoggers.  The operation is awaited and any
 * thrown exceptions are caught and transformed into an error result.
 * If an error occurs, it is logged.  The result of the operation is
 * transformed into a ExecuteGoalResult.  If an exception is caught,
 * the returned code is guaranteed to be non-zero.
 */
function spawnExecuteLogger(swc: SpawnWatchCommand): ExecuteLogger {

    return async (log: ProgressLog) => {
        const opts: SpawnOptions = {
            ...swc.cmd.options,
        };
        if (swc.cwd) {
            opts.cwd = swc.cwd;
        }
        let res: ChildProcessResult;
        try {
            res = await spawnAndWatch(swc.cmd, opts, log);
        } catch (e) {
            res = {
                error: true,
                code: -1,
                message: `Spawned command errored: ${swc.cmd.command} ${swc.cmd.args.join(" ")}: ${e.message}`,
                childProcess: undefined,
            };
        }
        if (res.error) {
            if (!res.message) {
                res.message = `Spawned command failed (status:${res.code}): ${swc.cmd.command} ${swc.cmd.args.join(" ")}`;
            }
            logger.error(res.message);
            log.write(res.message);
        }
        return res;
    };
}

/**
 * Transform a GitCommandGitProject operation into an ExecuteLogger
 * suitable for execution by executeLoggers.  The operation is awaited
 * and any thrown exceptions are caught and transformed into an error
 * result.  The returned standard out and standard error are written
 * to the log.  If an error occurs, it is logged.  The result of the
 * operation is transformed into a ExecuteGoalResult.  If an error is
 * returned or exception caught, the returned code is guaranteed to be
 * non-zero.
 */
function gitExecuteLogger(gp: GitCommandGitProject, op: () => Promise<GitCommandGitProject>): ExecuteLogger {

    return async (log: ProgressLog) => {
        try {
            await op();
        } catch (e) {
            return Failure;
        }
        return Success;
    };
}

/**
 * Execute an array of logged commands, creating a line-delimited
 * progress log beforehand, flushing after each command, and closing
 * it at the end.  If any command fails, bail out and return the
 * failure result.  Otherwise return Success.
 */
async function executeLoggers(els: ExecuteLogger[], progressLog: ProgressLog): Promise<ExecuteGoalResult> {
    const log = new DelimitedWriteProgressLogDecorator(progressLog, "\n");
    for (const cmd of els) {
        const res = await cmd(log);
        await log.flush();
        if (res.code !== 0) {
            await log.close();
            return res;
        }
    }
    await log.close();
    return Success;
}

/**
 * Return today's date in a format that does not suck.
 *
 * @return today's date in YYYY-MM-DD format
 */
export function formatDate(date?: Date): string {
    const now = (date) ? date : new Date();
    const year = now.getFullYear();
    const monthDay = now.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }).replace("/", "-");
    return `${year}-${monthDay}`;
}

/**
 * Create a Changelog goal with preConditions if provided
 * @param {Goal} preConditions
 * @returns {Goal}
 */
export function releaseChangelogGoal(...preConditions: Goal[]): Goal {
    const goal = new Goal({
        uniqueName: "ReleaseChangeLog",
        environment: ProductionEnvironment,
        orderedName: "3-release-change-log",
        displayName: "update changelog",
        workingDescription: "Updating changelog",
        completedDescription: "Updated changelog",
        failedDescription: "Updating changelog failure",
        isolated: true,
    });

    if (preConditions && preConditions.length > 0) {
        return new GoalWithPrecondition(goal.definition, ...preConditions);
    } else {
        return goal;
    }
}

/**
 * Modify changelog text to add release.
 *
 * @param changelog original changelog content
 * @param version release version
 * @return new changelog content
 */
export function changelogAddRelease(changelog: string, version: string): string {
    const releaseRegExp = new RegExp(`^## \\[${version}\\]`, "m");
    if (releaseRegExp.test(changelog)) {
        return changelog;
    }
    const date = formatDate();
    return changelog.replace(/^\[Unreleased\]:\s*(http.*\/compare)\/(\d+\.\d+\.\d+(?:-\S+)?)\.{3}HEAD/m,
        `[Unreleased]: \$1/${version}...HEAD

## [${version}][] - ${date}

[${version}]: \$1/\$2...${version}`)
        .replace(/^##\s*\[Unreleased\]\((http.*\/compare)\/(\d+\.\d+\.\d+(?:-\S+)?)\.{3}HEAD\)/m,
            `## [Unreleased](\$1/${version}...HEAD)

## [${version}](\$1/\$2...${version}) - ${date}`)
        .replace(/^##\s*\[Unreleased\]\((http.*)\/tree\/HEAD\)/m,
            `## [Unreleased](\$1/compare/${version}...HEAD)

## [${version}](\$1/tree/${version}) - ${date}`);
}

/**
 * Create entry in changelog for release.
 */
export function executeReleaseChangelog(
    projectLoader: ProjectLoader,
): ExecuteGoal {

    return async (gi: GoalInvocation): Promise<ExecuteGoalResult> => {
        const { credentials, id, context } = gi;

        return projectLoader.doWithProject({ credentials, id, context, readOnly: false }, async p => {
            const version = await rwlcVersion(gi);
            const versionRelease = releaseOrPreRelease(version, gi);
            const gp = p as GitCommandGitProject;

            const log = new DelimitedWriteProgressLogDecorator(gi.progressLog, "\n");
            const slug = `${gp.id.owner}/${gp.id.repo}`;
            const branch = gi.sdmGoal.branch;
            const remote = gp.remote || "origin";
            const preEls: ExecuteLogger[] = [
                gitExecuteLogger(gp, () => gp.checkout(branch)),
                spawnExecuteLogger({ cmd: { command: "git", args: ["pull", remote, branch] }, cwd: gp.baseDir }),
            ];
            await loglog(log, `Pulling branch ${branch} of ${slug}`);
            const preRes = await executeLoggers(preEls, gi.progressLog);
            if (preRes.code !== 0) {
                return preRes;
            }
            gp.branch = branch;

            const changelogPath = "CHANGELOG.md";
            await loglog(log, `Preparing changelog in ${slug} for release ${versionRelease}`);
            const egr: ExecuteGoalResult = { code: 0 };
            try {
                const changelogFile = await gp.findFile(changelogPath);
                const changelog = await changelogFile.getContent();
                const newChangelog = changelogAddRelease(changelog, versionRelease);
                const compareUrlRegExp = new RegExp(`^\\[${versionRelease}\\]: (http\\S*)`, "m");
                const compareUrlMatch = compareUrlRegExp.exec(newChangelog);
                if (compareUrlMatch && compareUrlMatch.length > 1 && compareUrlMatch[1]) {
                    egr.targetUrl = compareUrlMatch[1];
                }
                if (newChangelog === changelog) {
                    egr.message = `Changelog already contains release ${versionRelease}`;
                    return egr;
                }
                await changelogFile.setContent(newChangelog);
                egr.message = `Successfully added release ${versionRelease} to changelog`;
            } catch (e) {
                const message = `Failed to update changelog for release ${versionRelease}: ${e.message}`;
                logger.error(message);
                log.write(`${message}\n`);
                await log.flush();
                await log.close();
                return { code: 1, message };
            }
            await loglog(log, egr.message);

            const postEls: ExecuteLogger[] = [
                gitExecuteLogger(gp, () => gp.commit(`Changelog: add release ${versionRelease}

[atomist:generated]`)),
                gitExecuteLogger(gp, () => gp.push()),
            ];
            await loglog(log, `Committing and pushing changelog for ${slug} release ${versionRelease}`);
            const postRes = await executeLoggers(postEls, gi.progressLog);
            if (postRes.code !== 0) {
                return postRes;
            }
            return egr;
        });
    };
}
