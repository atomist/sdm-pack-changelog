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
    EventFired,
    HandlerContext,
    HandlerResult,
    logger,
    Parameters,
    Success,
    Value,
} from "@atomist/automation-client";
import { OnEvent } from "@atomist/automation-client/onEvent";
import {
    addChangelogEntryForClosedIssue,
    addChangelogEntryForCommit,
} from "../../changelog/changelog";
import {
    ClosedIssueWithChangelogLabel,
    PushWithChangelogLabel,
} from "../../typings/types";

@Parameters()
export class TokenParameters {
    @Value("token")
    public orgToken: string;
}

export const UpdateChangelogForIssueOrPullRequest: OnEvent<any, TokenParameters> =
    (e: EventFired<any>, ctx: HandlerContext, params: TokenParameters): Promise<HandlerResult> => {
        if (e.data.Issue) {
            return addChangelogEntryForClosedIssue(
                e.data.Issue[0] as ClosedIssueWithChangelogLabel.Issue,
                params.orgToken);
        } else if (e.data.PullRequest) {
            return addChangelogEntryForClosedIssue(
                e.data.PullRequest[0] as ClosedIssueWithChangelogLabel.Issue,
                params.orgToken);
        } else {
            logger.warn(`Received event was neither an Issue nor PullRequest`);
            return Promise.resolve(Success);
        }
    };

export const UpdateChangelogForCommit: OnEvent<PushWithChangelogLabel.Subscription, TokenParameters> =
    (e: EventFired<PushWithChangelogLabel.Subscription>, ctx: HandlerContext, params: TokenParameters): Promise<HandlerResult> => {
        if ((e.data.Push)) {
            return addChangelogEntryForCommit(e.data.Push[0], params.orgToken);
        } else {
            logger.warn(`Received event had no Push`);
            return Promise.resolve(Success);
        }
    };
