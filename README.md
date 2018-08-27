# @atomist/sdm-pack-changelog

[![atomist sdm goals](http://badge.atomist.com/T29E48P34/atomist/sdm-pack-changelog/357b4015-f10d-4ebd-a825-0d033c1e75bd)](https://app.atomist.com/workspace/T29E48P34)
[![npm version](https://img.shields.io/npm/v/@atomist/sdm-pack-changelog/next.svg)](https://www.npmjs.com/package/@atomist/sdm-pack-changelog/v/next)

Extension Pack for an Atomist SDM to manage changelogs as per [Keep a Changelog](http://keepachangelog.com/).

This extension pack lets you install the issue and pull request labels via `@atomist add changelog labels`.
When those labels (changelog:* prefix) are assigned to issues and/or pull requests, those issues and pull requests
will be added to the `CHANGELOG.md` once they get closed.

Additionally this pack also provides a `releaseChangelogGoal()` method to create a goal that can get added to 
your SDM. This goal will convert the `Unreleased` section of the `CHANGELOG.md` to a versioned section.   
                                    
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
channel on our community Slack team
at [atomist-community.slack.com][slack].

If you find a problem, please create an [issue][].

[issue]: https://github.com/atomist/automation-client-ts/issues

## Development

You will need to install [Node][node] to build and test this project.

[node]: https://nodejs.org/ (Node.js)

To run tests, define a GITHUB_TOKEN to any valid token that has repo access. The tests
will create and delete repositories.

Define GITHUB_VISIBILITY=public if you want these to be public; default is private.
You'll get a 422 response from repo creation if you don't pay for private repos.

### Build and Test

Command | Reason
------- | ------
`npm install` | install all the required packages
`npm run build` | lint, compile, and test
`npm run lint` | run tslint against the TypeScript
`npm run compile` | compile all TypeScript into JavaScript
`npm test` | run tests and ensure everything is working
`npm run clean` | remove stray compiled JavaScript files and build directory

### Release

Releases are handled via the [Atomist SDM][atomist-sdm].  Just press
the 'Approve' button in the Atomist dashboard or Slack.

[atomist-sdm]: https://github.com/atomist/atomist-sdm (Atomist Software Delivery Machine)

---

Created by [Atomist][atomist].
Need Help?  [Join our Slack workspace][slack].

[atomist]: https://atomist.com/ (Atomist - How Teams Deliver Software)
[slack]: https://join.atomist.com/ (Atomist Community Slack)

