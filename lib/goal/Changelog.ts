/**
 * Goal that performs autofixes: For example, linting and adding license headers.
 */
import {
    DefaultGoalNameGenerator,
    FulfillableGoal,
    FulfillableGoalDetails,
    getGoalDefinitionFrom,
    Goal,
    GoalDefinition,
    LogSuppressor,
    ProductionEnvironment,
} from "@atomist/sdm";
import { executeReleaseChangelog } from "../changelog/releaseGoal";

/**
 * Changelog goal that releases the current version in the CHANGELOG.md file
 */
export class Changelog extends FulfillableGoal {

    constructor(goalDetailsOrUniqueName: FulfillableGoalDetails | string = DefaultGoalNameGenerator.generateName("changelog"),
                ...dependsOn: Goal[]) {

        super({
            ...ChangelogDefinition,
            ...getGoalDefinitionFrom(goalDetailsOrUniqueName, DefaultGoalNameGenerator.generateName("changelog")),
            displayName: "autofix",
        }, ...dependsOn);

        this.addFulfillment({
            name: `changelog-${this.definition.uniqueName}`,
            logInterpreter: LogSuppressor,
            goalExecutor: executeReleaseChangelog(),
        });
    }
}


const ChangelogDefinition: GoalDefinition = {
    uniqueName: "ReleaseChangeLog",
    environment: ProductionEnvironment,
    orderedName: "3-release-change-log",
    displayName: "update changelog",
    workingDescription: "Updating changelog",
    completedDescription: "Updated changelog",
    failedDescription: "Updating changelog failure",
    isolated: true,
};
