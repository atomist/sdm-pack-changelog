# @atomist/sdm-pack-changelog

[![atomist sdm goals](http://badge.atomist.com/T29E48P34/atomist/sdm-pack-changelog/357b4015-f10d-4ebd-a825-0d033c1e75bd)](https://app.atomist.com/workspace/T29E48P34)
[![npm version](https://img.shields.io/npm/v/@atomist/sdm-pack-changelog/next.svg)](https://www.npmjs.com/package/@atomist/sdm-pack-changelog/v/next)

Extension Pack for an Atomist SDM to manage changelogs as per [Keep a
Changelog](http://keepachangelog.com/).

This extension pack lets you install the issue and pull request labels
via `@atomist add changelog labels`.  When those labels (changelog:*
prefix) are assigned to issues and/or pull requests, those issues and
pull requests will be added to the `CHANGELOG.md` once they get
closed.

Additionally this pack also provides a `releaseChangelogGoal()` method
to create a goal that can get added to your SDM. This goal will
convert the `Unreleased` section of the `CHANGELOG.md` to a versioned
section.

See the [Atomist documentation][atomist-doc] for more information on
what SDMs are and what they can do for you using the Atomist API for
software.

[atomist-doc]: https://docs.atomist.com/ (Atomist Documentation)

## Usage

1. First install the dependency in your SDM project

```
$ npm install @atomist/sdm-pack-changelog
```

2. Install the support

```
import { changelogSupport } from "@atomist/sdm-pack-changelog";

sdm.addExtensionPacks(
    changelogSupport()
);
```

3. Add configuration to your client configuration

```
// no configuration needed
```

## Support

General support questions should be discussed in the `#support`
channel in the [Atomist community Slack workspace][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist/sdm-pack-change-log/issues

## Development

You will need to install [Node.js][node] to build and test this project.

[node]: https://nodejs.org/ (Node.js)

### Build and test

Install dependencies.

```
$ npm install
```

Use the `build` package script to compile, test, lint, and build the
documentation.

```
$ npm run build
```

### Release

Releases are handled via the [Atomist SDM][atomist-sdm].  Just press
the 'Approve' button in the Atomist dashboard or Slack.

[atomist-sdm]: https://github.com/atomist/atomist-sdm (Atomist Software Delivery Machine)

---

Created by [Atomist][atomist].
Need Help?  [Join our Slack workspace][slack].

[atomist]: https://atomist.com/ (Atomist - How Teams Deliver Software)
[slack]: https://join.atomist.com/ (Atomist Community Slack)
