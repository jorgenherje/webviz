import { EnsembleSet } from "../EnsembleSet";

export function maybeAssignFirstSyncedEnsemble(
    currIdentString: string | null,
    syncedEnsembleValues: string[] | null
): string | null {
    if (!syncedEnsembleValues || syncedEnsembleValues.length < 1) {
        return currIdentString;
    }

    const syncedEnsembleIdent = syncedEnsembleValues[0];
    if (syncedEnsembleIdent === currIdentString) {
        return currIdentString;
    }
    return syncedEnsembleIdent;
}

/**
 * Validates the the RegularEnsembleIdent or DeltaEnsembleIdent specified in currIdent against the
 * contents of the EnsembleSet and fixes the value if it isn't valid.
 *
 * Returns null if an empty EnsembleSet is specified.
 *
 * Note that if the specified RegularEnsembleIdents and DeltaEnsembleIdents are valid, this function
 * will always return a reference to the exact same object that was passed in currIdent. This
 * means that you can compare the references (fixedIdent !== currIdent) to detect any changes.
 */
export function fixupEnsembleIdent(currIdent: string | null, ensembleSet: EnsembleSet | null): string | null {
    if (!ensembleSet?.hasAnyEnsembles()) {
        return null;
    }

    if (currIdent && ensembleSet.hasEnsemble(currIdent)) {
        return currIdent;
    }

    return ensembleSet.getEnsembleArray()[0].getIdent();
}

/**
 *
 * Validates the the EnsembleIdents or DeltaEnsembleIdents specified in currIdents against the
 * contents of the EnsembleSet and fixes the value if it isn't valid.
 *
 * Returns null if an empty EnsembleSet is specified.
 *
 * Note that if the specified EnsembleIdents and DeltaEnsembleIdents are valid, this function
 * will always return a reference to the exact same object that was passed in currIdent. This
 * means that you can compare the references (fixedIdent !== currIdent) to detect any changes.
 */
export function fixupEnsembleIdents(currIdents: string[] | null, ensembleSet: EnsembleSet | null): string[] | null {
    if (!ensembleSet?.hasAnyEnsembles()) {
        return null;
    }

    if (currIdents === null || currIdents.length === 0) {
        return [ensembleSet.getEnsembleArray()[0].getIdent()];
    }

    return currIdents.filter((currIdent) => ensembleSet.hasEnsemble(currIdent));
}
