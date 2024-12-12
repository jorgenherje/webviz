/**
 * Generates a regex pattern for a UUID.
 */
function ensembleIdentUuidRegexString(): string {
    return "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}";
}

/**
 * Generates a regex pattern for an ensemble ident.
 *
 * With named groups for case uuid and ensemble name, and without the start and end anchors.
 *
 */
// function ensembleIdentRegexStringWithoutAnchors(caseUuidNamedGroup: string, ensembleNameNamedGroup: string): string {
//     return `(?<${caseUuidNamedGroup}>${ensembleIdentUuidRegexString()})::(?<${ensembleNameNamedGroup}>.*)`;
// }

/**
 * Get regex for a regular ensemble ident.
 */
function regularEnsembleIdentRegex(): RegExp {
    return new RegExp(`^(?<caseUuid>${ensembleIdentUuidRegexString()})::(?<ensembleName>.*)$`);
}

/**
 * Get regex for a delta ensemble ident.
 *
 * The delta ensemble ident is a string representation of the two ensemble idents used to define the delta ensemble,
 * with a special character delimiter.
 */
function deltaEnsembleIdentRegex(): RegExp {
    const compareEnsembleIdentRegexString = `(?<compareCaseUuid>${ensembleIdentUuidRegexString()})::(?<compareEnsembleName>.*)`;
    const referenceEnsembleIdentRegexString = `(?<referenceCaseUuid>${ensembleIdentUuidRegexString()})::(?<referenceEnsembleName>.*)`;
    return new RegExp(`^~@@~${compareEnsembleIdentRegexString}~@@~${referenceEnsembleIdentRegexString}~@@~$`);
}

/**
 * EnsembleIdent is a unique identifier for an ensemble in a case - a combination of case uuid and ensemble name.
 *
 * These are represented as strings on specific formats, and are used to identify ensembles in the front-end framework.
 *
 * In the front-end framework this is used to identify ensembles in an EnsembleSet, and is used for the queries towards back-end.
 *
 * The front-end framework has various definitions of ensembles:
 *
 *  - RegularEnsemble
 *  - DeltaEnsemble
 *
 *
 * NOTES:
 *
 * Pros:
 *  - No need fore equals() function as strings are directly comparable.
 *  - No need for toString() function as the string representation is the same as the object.
 *  - No need for a constructor as the class is static.
 *  - No switching between EnsembleIdent instances to string representation, and vice versa, when coding/using the idents throughout the application.
 *  - No need for overrides in:
 *       - `EnsembleSet` class
 *       - `fixupEnsembleIdent()` function
 *       - `fixupEnsembleIdents()` function
 *       - `EnsembleDropdown` component
 *       - `EnsembleSelect` component
 *       - `RealizationFilter` component
 *
 * Cons:
 *  - Personally I feel to verify the string before converting, thus the isValidEnsembleIdentString() function is called a lot, and the code
 *    becomes more "heavy" when the ensemble ident string are in used, especially when needing to extract the case uuid and ensemble name.
 *  - Does not allow override for `EnsembleSet` findEnsemble()-method:
 *         - Has to perform check of which ensemble type retrieved - `findEnsemble(ensembleIdentString: string): RegularEnsemble | DeltaEnsemble | null;`
 *         - Introduces `findRegularEnsemble()` and `findDeltaEnsemble()` methods in `EnsembleSet` class.
 *  - Has to manually convert/extract info from the ident string using the correct converter before query:
 *          - Perform a check of which ensemble string there is before calling the back-end queries.
 *          - For modules not supporting delta ensemble, the string has to be validated as regular ensemble ident before usage, as `DeltaEnsemble` is
 *            a return type for EnsembleSet.findEnsemble().
 *          - Has to perform two steps isValidDeltaEnsembleIdentString() and deltaEnsembleCaseUuidsAndNamesFromString() to get the case uuids and ensemble names.
 *  - Loosing the easy typescript type flow from RegularEnsembleIdent and DeltaEnsembleIdent
 *          - E.g. when opt-in DeltaEnsemble for a module, the atoms will get duck-typed and the usage of the atoms will be more error-prone with class instances.
 *          - How to control which ensemble ident string "flying around" in the modules? I.e. how to prevent delta ensembles to be used in a module
 *            not supporting delta ensembles?
 *
 *
 */
export class EnsembleIdent {
    /**
     * Check if provided ensemble ident string is a valid ensemble ident - of any type.
     */
    static isValidEnsembleIdentString(ensembleIdentString: string): boolean {
        if (this.isValidRegularEnsembleIdentString(ensembleIdentString)) {
            return true;
        }
        if (this.isValidDeltaEnsembleIdentString(ensembleIdentString)) {
            return true;
        }
        return false;
    }

    /**
     * Create a regular ensemble ident string from case uuid and ensemble name.
     */
    static createRegularEnsembleIdentString(caseUuid: string, ensembleName: string): string {
        return `${caseUuid}::${ensembleName}`;
    }

    /**
     * Check if provided ensemble ident string is a valid regular ensemble ident.
     */
    static isValidRegularEnsembleIdentString(ensembleIdentString: string): boolean {
        const result = regularEnsembleIdentRegex().exec(ensembleIdentString);
        return !!result && !!result.groups && !!result.groups.caseUuid && !!result.groups.ensembleName;
    }

    /**
     * Extract case uuid and ensemble name from a regular ensemble ident string.
     *
     * TODO:
     *  - Provide an interface for the return object?
     *  - Rename to deserializeRegularEnsembleIdentString() ?
     */
    static regularEnsembleCaseUuidAndNameFromString(ensembleIdentString: string): {
        caseUuid: string;
        ensembleName: string;
    } {
        const result = regularEnsembleIdentRegex().exec(ensembleIdentString);
        if (!result || !result.groups || !result.groups.caseUuid || !result.groups.ensembleName) {
            throw new Error(`Invalid regular ensemble ident string: ${ensembleIdentString}`);

            // TODO: Should this return null instead of throwing an error?
            // return {caseUuid: null, ensembleName: null};
        }

        const { caseUuid, ensembleName } = result.groups;

        return { caseUuid, ensembleName };
    }

    /**
     * Create a delta ensemble ident string from case uuid and ensemble name for two ensembles.
     */
    static createDeltaEnsembleIdentStringFromCaseUuidsAndEnsembleName(
        compareEnsemble: { caseUuid: string; ensembleName: string },
        referenceEnsemble: { caseUuid: string; ensembleName: string }
    ): string {
        const compareEnsembleIdentString = EnsembleIdent.createRegularEnsembleIdentString(
            compareEnsemble.caseUuid,
            compareEnsemble.ensembleName
        );
        const referenceEnsembleIdentString = EnsembleIdent.createRegularEnsembleIdentString(
            referenceEnsemble.caseUuid,
            referenceEnsemble.ensembleName
        );
        return `~@@~${compareEnsembleIdentString}~@@~${referenceEnsembleIdentString}~@@~`;
    }

    /**
     * Create a delta ensemble ident string from two regular ensemble ident strings.
     *
     * TODO: Decide which method (v1 or v2) to use
     */
    static createDeltaEnsembleIdentString(
        compareEnsembleIdentString: string,
        referenceEnsembleIdentString: string
    ): string {
        if (!this.isValidRegularEnsembleIdentString(compareEnsembleIdentString)) {
            throw new Error(`Invalid compare ensemble ident string: ${compareEnsembleIdentString}`);
        }
        if (!this.isValidRegularEnsembleIdentString(referenceEnsembleIdentString)) {
            throw new Error(`Invalid reference ensemble ident string: ${referenceEnsembleIdentString}`);
        }

        return `~@@~${compareEnsembleIdentString}~@@~${referenceEnsembleIdentString}~@@~`;
    }

    /**
     * Check if provided ensemble ident string is a valid delta ensemble ident.
     */
    static isValidDeltaEnsembleIdentString(ensembleIdentString: string): boolean {
        const regex = deltaEnsembleIdentRegex();
        const result = regex.exec(ensembleIdentString);
        return (
            !!result &&
            !!result.groups &&
            !!result.groups.compareCaseUuid &&
            !!result.groups.compareEnsembleName &&
            !!result.groups.referenceCaseUuid &&
            !!result.groups.referenceEnsembleName
        );
    }

    /**
     * Extract case uuids and ensemble names for the compare and reference ensemble from a delta ensemble ident string.
     */
    static deltaEnsembleCaseUuidsAndNamesFromString(ensembleIdentString: string): {
        compareEnsemble: { caseUuid: string; ensembleName: string };
        referenceEnsemble: { caseUuid: string; ensembleName: string };
    } {
        const result = deltaEnsembleIdentRegex().exec(ensembleIdentString);
        if (
            !this.isValidDeltaEnsembleIdentString(ensembleIdentString) ||
            !result ||
            !result.groups ||
            !result.groups.compareCaseUuid ||
            !result.groups.compareEnsembleName ||
            !result.groups.referenceCaseUuid ||
            !result.groups.referenceEnsembleName
        ) {
            throw new Error(`Invalid delta ensemble ident string: ${ensembleIdentString}`);
        }

        return {
            compareEnsemble: {
                caseUuid: result.groups.compareCaseUuid,
                ensembleName: result.groups.compareEnsembleName,
            },
            referenceEnsemble: {
                caseUuid: result.groups.referenceCaseUuid,
                ensembleName: result.groups.referenceEnsembleName,
            },
        };
    }
}
