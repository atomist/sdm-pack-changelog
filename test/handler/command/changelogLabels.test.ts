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

import * as GitHubApi from "@octokit/rest";
import * as assert from "power-assert";
import {
    ChangelogLabels,
    upsertChangelogLabels,
} from "../../../lib/handler/command/changelogLabels";

describe("changelogLabels", () => {

    describe("AddChangelogLabels", () => {
        interface GetLabel {
            name: string;
            repo: string;
            owner: string;
        }
        interface CreateLabel extends GetLabel {
            color: string;
        }

        it("should create changelog labels", async () => {
            const created: CreateLabel[] = [];
            const api: GitHubApi = {
                issues: {
                    getLabel: (l: any) => { throw new Error("does not exist"); },
                    createLabel: (l: any) => created.push(l),
                },
            } as any;
            const owner = "mercury";
            const repo = "venus";
            const result = await upsertChangelogLabels({ api, owner, repo });
            assert(result.code === 0);
            assert(created.length === ChangelogLabels.length + 1);
            created.forEach(l => {
                assert(l.owner === owner);
                assert(l.repo === repo);
            });
            for (let i = 0; i < ChangelogLabels.length; i++) {
                assert(created[i].name === `changelog:${ChangelogLabels[i]}`);
                assert(created[i].color === "C5DB71");
            }
            assert(created[ChangelogLabels.length].name === "breaking");
            assert(created[ChangelogLabels.length].color === "B60205");
        });

        it("should do nothing if changelog labels exist", async () => {
            const created: CreateLabel[] = [];
            const api: GitHubApi = {
                issues: {
                    getLabel: (l: any) => l,
                    createLabel: (l: any) => assert.fail(`should not create existing label: ${l.name}`),
                },
            } as any;
            const owner = "mercury";
            const repo = "venus";
            const result = await upsertChangelogLabels({ api, owner, repo });
            assert(result.code === 0);
            assert(created.length === 0);
        });

        it("should create non-existent changelog labels", async () => {
            const created: CreateLabel[] = [];
            const api: GitHubApi = {
                issues: {
                    getLabel: (l: any) => {
                        if (l.name !== "breaking") {
                            return l;
                        }
                        throw new Error("does not exist");
                    },
                    createLabel: (l: any) => created.push(l),
                },
            } as any;
            const owner = "mercury";
            const repo = "venus";
            const result = await upsertChangelogLabels({ api, owner, repo });
            assert(result.code === 0);
            assert(created.length === 1);
            assert(created[0].owner === owner);
            assert(created[0].repo === repo);
            assert(created[0].name === "breaking");
            assert(created[0].color === "B60205");
        });

        it("should report a failure to create", async () => {
            const api: GitHubApi = {
                issues: {
                    getLabel: (l: any) => { throw new Error("does not exist"); },
                    createLabel: (l: any) => { throw new Error("double secret message"); },
                },
            } as any;
            const owner = "mercury";
            const repo = "venus";
            const result = await upsertChangelogLabels({ api, owner, repo });
            assert(result.code === 1);
            assert(result.message === `Failed to add changelog labels to ${owner}/${repo}: double secret message`);
        });

    });

});
