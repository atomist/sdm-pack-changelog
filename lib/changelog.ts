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

import { GraphQL } from "@atomist/automation-client";
import {
    ExtensionPack,
    Goal,
    metadata,
} from "@atomist/sdm";
import { executeReleaseChangelog } from "./changelog/releaseGoal";
import { AddChangelogLabels } from "./handler/command/changelogLabels";
import {
    TokenParameters,
    UpdateChangelogForCommit,
    UpdateChangelogForIssueOrPullRequest,
} from "./handler/event/updateChangelog";

/**
 * Register support for managing CHANGELOG.md files in your SDM.
 * Note: If a goal gets passed to this function, this pack will
 * register a goal implementation for the given goal.
 * @param {Goal} goal
 * @returns {ExtensionPack}
 */
export function changelogSupport(goal?: Goal): ExtensionPack {
    return {
        ...metadata(),
        configure: sdm => {

            if (goal) {
                sdm.addGoalImplementation(
                    "releaseChangelog",
                    goal,
                    executeReleaseChangelog(sdm.configuration.sdm.projectLoader),
                );
            }

            sdm.addCommand(AddChangelogLabels);
            sdm.addEvent({
                    name: "UpdateChangelogOnIssue",
                    description: "Update CHANGELOG.md on a closed label",
                    tags: [ "github", "changelog", "issue" ],
                    subscription: GraphQL.subscription("closedIssueWithChangelogLabel"),
                    paramsMaker: TokenParameters,
                    listener: UpdateChangelogForIssueOrPullRequest,
                })
                .addEvent({
                    name: "UpdateChangelogOnPullRequest",
                    description: "Update CHANGELOG.md on a closed pull request",
                    tags: [ "github", "changelog", "pr" ],
                    subscription: GraphQL.subscription("closedPullRequestWithChangelogLabel"),
                    paramsMaker: TokenParameters,
                    listener: UpdateChangelogForIssueOrPullRequest,
                })
                .addEvent({
                    name: "UpdateChangelogOnPush",
                    description: "Update CHANGELOG.md on a push",
                    tags: [ "github", "changelog", "commit" ],
                    subscription: GraphQL.subscription("pushWithChangelogLabel"),
                    paramsMaker: TokenParameters,
                    listener: UpdateChangelogForCommit,
                });
        },
    };
}
