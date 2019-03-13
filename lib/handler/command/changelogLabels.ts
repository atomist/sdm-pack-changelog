/*
 * Copyright © 2019 Atomist, Inc.
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
    HandlerResult,
    MappedParameter,
    MappedParameters,
    Parameters,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { CommandHandlerRegistration } from "@atomist/sdm";
import { bold } from "@atomist/slack-messages";
import * as GitHubApi from "@octokit/rest";
import * as github from "../../util/gitHubApi";
import { success } from "../../util/messages";

export const ChangelogLabels = [
    "added",
    "changed",
    "deprecated",
    "removed",
    "fixed",
    "security",
];

@Parameters()
export class ChangelogParameters {

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @MappedParameter(MappedParameters.GitHubApiUrl)
    public apiUrl: string;

    @Secret(Secrets.userToken("repo"))
    public githubToken: string;
}

/**
 * CommandHandler to add required changelog labels to a given repo.
 * @returns {HandleCommand<ChangelogParameters>}
 */
export const AddChangelogLabels: CommandHandlerRegistration<ChangelogParameters> = {
    name: "AddChangelogLabels",
    intent: "add changelog labels",
    description: "Add changelog labels to a GitHub repo",
    tags: ["github", "changelog", "label"],
    paramsMaker: ChangelogParameters,
    listener: async cli => {
        const result = await upsertChangelogLabels({
            api: github.api(cli.parameters.githubToken, cli.parameters.apiUrl),
            owner: cli.parameters.owner,
            repo: cli.parameters.repo,
        });
        const msg = (result.code === 0) ?
            `Successfully added changelog labels to ${bold(cli.parameters.owner + "/" + cli.parameters.repo)}` :
            result.message;
        await cli.context.messageClient.respond(success("Changelog Labels", msg));
        return result;
    },
};

/**
 * Information needed to check and create a label.
 */
interface UpsertChangelogLabelsInfo {
    /** @octokit/rest API to use to query and create label. */
    api: GitHubApi;
    /** Name of repository in which to create label */
    repo: string;
    /** Owner of repository in which to create label */
    owner: string;
}

export async function upsertChangelogLabels(info: UpsertChangelogLabelsInfo): Promise<HandlerResult> {
    const labels: UpsertLabelInfo[] = ChangelogLabels.map(l => ({
        api: info.api,
        owner: info.owner,
        repo: info.repo,
        name: `changelog:${l}`,
        color: "C5DB71",
    }));
    labels.push({
        api: info.api,
        owner: info.owner,
        repo: info.repo,
        name: "breaking",
        color: "B60205",
    });
    try {
        await Promise.all(labels.map(upsertLabel));
    } catch (e) {
        const message = `Failed to add changelog labels to ${info.owner}/${info.repo}: ${e.message}`;
        return { code: 1, message };
    }
    return Success;
}

/**
 * Information needed to check and create a label.
 */
interface UpsertLabelInfo extends UpsertChangelogLabelsInfo {
    /** Name of label to upsert */
    name: string;
    /** Color of label */
    color: string;
}

/**
 * Create a label if it does not exist.
 *
 * @param info label details
 */
async function upsertLabel(info: UpsertLabelInfo): Promise<void> {
    try {
        await info.api.issues.getLabel({
            name: info.name,
            repo: info.repo,
            owner: info.owner,
        });
    } catch (err) {
        await info.api.issues.createLabel({
            owner: info.owner,
            repo: info.repo,
            name: info.name,
            color: info.color,
        });
    }

}
