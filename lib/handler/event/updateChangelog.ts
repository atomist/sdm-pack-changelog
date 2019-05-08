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
    OnEvent,
    Parameters,
    Secret,
    Secrets,
    Success,
    TokenCredentials,
    Value,
} from "@atomist/automation-client";
import {
    CredentialsResolver,
    resolveCredentialsPromise,
} from "@atomist/sdm";
import {
    addChangelogEntryForClosedIssue,
    addChangelogEntryForCommit,
} from "../../changelog/changelog";
import {
    ClosedIssueWithChangelogLabel,
    ClosedPullRequestWithChangelogLabel,
    PushWithChangelogLabel,
} from "../../typings/types";

@Parameters()
export class TokenParameters {
    @Secret(Secrets.OrgToken)
    public orgToken: string;

    @Value("sdm.credentialsResolver")
    public credentialsResolver: CredentialsResolver;

}

export const UpdateChangelogForIssueOrPullRequest: OnEvent<any, TokenParameters> =
    async (e: EventFired<any>, ctx: HandlerContext, params: TokenParameters): Promise<HandlerResult> => {

        const creds =
            await resolveCredentialsPromise(params.credentialsResolver.eventHandlerCredentials(ctx)) as TokenCredentials;

        if (e.data.Issue) {
            return addChangelogEntryForClosedIssue(
                e.data.Issue[0] as ClosedIssueWithChangelogLabel.Issue,
                params.orgToken);
        } else if (e.data.PullRequest) {
            const pr = e.data.PullRequest[0] as ClosedPullRequestWithChangelogLabel.PullRequest;
            // Move that check back into subscription once https://github.com/atomisthq/automation-api/issues/517 is
            // fixed
            if (pr.merged) {
                return addChangelogEntryForClosedIssue(
                    e.data.PullRequest[0] as ClosedIssueWithChangelogLabel.Issue,
                    creds.token);
            } else {
                logger.debug(`PullRequest isn't merged`);
                return Success;
            }
        } else {
            logger.warn(`Received event was neither an Issue nor PullRequest`);
            return Success;
        }
    };

export const UpdateChangelogForCommit: OnEvent<PushWithChangelogLabel.Subscription, TokenParameters> =
    async (
        e: EventFired<PushWithChangelogLabel.Subscription>,
        ctx: HandlerContext,
        params: TokenParameters,
    ): Promise<HandlerResult> => {

        const creds =
            await resolveCredentialsPromise(params.credentialsResolver.eventHandlerCredentials(ctx)) as TokenCredentials;

        if ((e.data.Push)) {
            return addChangelogEntryForCommit(e.data.Push[0], creds.token);
        } else {
            logger.warn(`Received event had no Push`);
            return Success;
        }
    };
