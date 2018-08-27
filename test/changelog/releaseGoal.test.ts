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
    logger,
    LoggingConfig,
} from "@atomist/automation-client";
LoggingConfig.format = "cli";
(logger as any).level = process.env.LOG_LEVEL || "info";
import * as assert from "power-assert";
import {
    changelogAddRelease,
    formatDate,
} from "../../lib/changelog/releaseGoal";

describe("release", () => {

    describe("formatDate", () => {

        it("should return a properly formatted date", () => {
            const d = new Date("August 6, 1969");
            const e = "1969-08-06";
            const f = formatDate(d);
            assert(f === e);
        });

    });

    describe("changelogAddRelease", () => {

        const date = formatDate();
        const c = `# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased][]

[Unreleased]: https://github.com/atomist/atomist-sdm/compare/0.1.1...HEAD

### Added

-   Publish TypeDoc when Node project is released
-   Increment version after release
-   Common build tools to Docker image

### Changed

-   Lein support now uses atomist.sh to build

## [0.1.1][] - 2018-05-10

[0.1.1]: https://github.com/atomist/atomist-sdm/compare/0.1.0...0.1.1

Trigger release

### Changed

-   Version

## [0.1.0][] - 2018-05-10

Initial release

[0.1.0]: https://github.com/atomist/atomist-sdm/tree/0.1.0

### Added

-   Build, deploy, and release automation-client/SDM projects
-   Build and deploy lein projects
-   Build TypeScript projects
`;
        const e = `# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased][]

[Unreleased]: https://github.com/atomist/atomist-sdm/compare/0.2.0...HEAD

## [0.2.0][] - ${date}

[0.2.0]: https://github.com/atomist/atomist-sdm/compare/0.1.1...0.2.0

### Added

-   Publish TypeDoc when Node project is released
-   Increment version after release
-   Common build tools to Docker image

### Changed

-   Lein support now uses atomist.sh to build

## [0.1.1][] - 2018-05-10

[0.1.1]: https://github.com/atomist/atomist-sdm/compare/0.1.0...0.1.1

Trigger release

### Changed

-   Version

## [0.1.0][] - 2018-05-10

Initial release

[0.1.0]: https://github.com/atomist/atomist-sdm/tree/0.1.0

### Added

-   Build, deploy, and release automation-client/SDM projects
-   Build and deploy lein projects
-   Build TypeScript projects
`;

        it("should create a release section", () => {
            const n = changelogAddRelease(c, "0.2.0");
            assert(n === e);
        });

        it("should do nothing if section for release exists", () => {
            const n = changelogAddRelease(c, "0.1.1");
            assert(n === c);
        });

        const ci = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist/atomist-sdm/compare/0.1.1...HEAD)

### Added

-   Publish TypeDoc when Node project is released
-   Increment version after release
-   Common build tools to Docker image

### Changed

-   Lein support now uses atomist.sh to build

## [0.1.1](https://github.com/atomist/atomist-sdm/compare/0.1.0...0.1.1) - 2018-05-10

Trigger release

### Changed

-   Version

## [0.1.0](https://github.com/atomist/atomist-sdm/tree/0.1.0) - 2018-05-10

Initial release

### Added

-   Build, deploy, and release automation-client/SDM projects
-   Build and deploy lein projects
-   Build TypeScript projects
`;
        const ei = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist/atomist-sdm/compare/0.2.0...HEAD)

## [0.2.0](https://github.com/atomist/atomist-sdm/compare/0.1.1...0.2.0) - ${date}

### Added

-   Publish TypeDoc when Node project is released
-   Increment version after release
-   Common build tools to Docker image

### Changed

-   Lein support now uses atomist.sh to build

## [0.1.1](https://github.com/atomist/atomist-sdm/compare/0.1.0...0.1.1) - 2018-05-10

Trigger release

### Changed

-   Version

## [0.1.0](https://github.com/atomist/atomist-sdm/tree/0.1.0) - 2018-05-10

Initial release

### Added

-   Build, deploy, and release automation-client/SDM projects
-   Build and deploy lein projects
-   Build TypeScript projects
`;

        it("should create a release section with inline links", () => {
            const n = changelogAddRelease(ci, "0.2.0");
            assert(n === ei);
        });

        it("should do nothing if section for release with inline links exists", () => {
            const n = changelogAddRelease(ci, "0.1.1");
            assert(n === ci);
        });

        it("should create an initial release", () => {
            const ct = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist/sentry-automation/tree/HEAD)

### Added

-   This is my first test issue. [#1](https://github.com/atomist/sentry-automation/issues/1)
-   Some manual issue was added.

### Fixed

-   adada. [#2](https://github.com/atomist/sentry-automation/issues/2
`;
            const et = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist/sentry-automation/compare/0.1.0...HEAD)

## [0.1.0](https://github.com/atomist/sentry-automation/tree/0.1.0) - ${date}

### Added

-   This is my first test issue. [#1](https://github.com/atomist/sentry-automation/issues/1)
-   Some manual issue was added.

### Fixed

-   adada. [#2](https://github.com/atomist/sentry-automation/issues/2
`;

            const n = changelogAddRelease(ct, "0.1.0");
            assert(n === et);
        });

        it("should create a milestone release section", () => {
            const cl = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist/atomist-sdm/compare/0.1.1...HEAD)

### Added

-   Publish TypeDoc when Node project is released
-   Increment version after release
-   Common build tools to Docker image

### Changed

-   Lein support now uses atomist.sh to build

## [0.1.1](https://github.com/atomist/atomist-sdm/compare/0.1.0...0.1.1) - 2018-05-10

Trigger release

### Changed

-   Version

## [0.1.0](https://github.com/atomist/atomist-sdm/tree/0.1.0) - 2018-05-10

Initial release

### Added

-   Build, deploy, and release automation-client/SDM projects
-   Build and deploy lein projects
-   Build TypeScript projects
`;
            const el = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist/atomist-sdm/compare/1.0.0-M.2...HEAD)

## [1.0.0-M.2](https://github.com/atomist/atomist-sdm/compare/0.1.1...1.0.0-M.2) - ${date}

### Added

-   Publish TypeDoc when Node project is released
-   Increment version after release
-   Common build tools to Docker image

### Changed

-   Lein support now uses atomist.sh to build

## [0.1.1](https://github.com/atomist/atomist-sdm/compare/0.1.0...0.1.1) - 2018-05-10

Trigger release

### Changed

-   Version

## [0.1.0](https://github.com/atomist/atomist-sdm/tree/0.1.0) - 2018-05-10

Initial release

### Added

-   Build, deploy, and release automation-client/SDM projects
-   Build and deploy lein projects
-   Build TypeScript projects
`;

            const n = changelogAddRelease(cl, "1.0.0-M.2");
            assert(n === el);
        });

        it("should create a second milestone release section", () => {
            const cl = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist/atomist-sdm/compare/1.0.0-M.1...HEAD)

### Added

-   Publish TypeDoc when Node project is released
-   Increment version after release
-   Common build tools to Docker image

## [1.0.0-M.1](https://github.com/atomist/atomist-sdm/compare/0.1.1...1.0.0-M.1) - 2018-08-01

### Changed

-   Lein support now uses atomist.sh to build

## [0.1.1](https://github.com/atomist/atomist-sdm/compare/0.1.0...0.1.1) - 2018-05-10

Trigger release

### Changed

-   Version

## [0.1.0](https://github.com/atomist/atomist-sdm/tree/0.1.0) - 2018-05-10

Initial release

### Added

-   Build, deploy, and release automation-client/SDM projects
-   Build and deploy lein projects
-   Build TypeScript projects
`;
            const el = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist/atomist-sdm/compare/1.0.0-M.2...HEAD)

## [1.0.0-M.2](https://github.com/atomist/atomist-sdm/compare/1.0.0-M.1...1.0.0-M.2) - ${date}

### Added

-   Publish TypeDoc when Node project is released
-   Increment version after release
-   Common build tools to Docker image

## [1.0.0-M.1](https://github.com/atomist/atomist-sdm/compare/0.1.1...1.0.0-M.1) - 2018-08-01

### Changed

-   Lein support now uses atomist.sh to build

## [0.1.1](https://github.com/atomist/atomist-sdm/compare/0.1.0...0.1.1) - 2018-05-10

Trigger release

### Changed

-   Version

## [0.1.0](https://github.com/atomist/atomist-sdm/tree/0.1.0) - 2018-05-10

Initial release

### Added

-   Build, deploy, and release automation-client/SDM projects
-   Build and deploy lein projects
-   Build TypeScript projects
`;

            const n = changelogAddRelease(cl, "1.0.0-M.2");
            assert(n === el);
        });

    });

});
