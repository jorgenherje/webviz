import { DeltaEnsemble } from "./DeltaEnsemble";
import { EnsembleIdent } from "./EnsembleIdent";
import { RegularEnsemble } from "./RegularEnsemble";

export class EnsembleSet {
    private _regularEnsembleArray: RegularEnsemble[];
    private _deltaEnsembleArray: DeltaEnsemble[];

    constructor(ensembles: RegularEnsemble[], deltaEnsembles: DeltaEnsemble[] = []) {
        this._regularEnsembleArray = ensembles;
        this._deltaEnsembleArray = deltaEnsembles;
    }

    /**
     * Returns true if there are any regular ensembles in the set.
     * @returns True if there are any regular ensembles in the set.
     */
    hasAnyRegularEnsembles(): boolean {
        return this._regularEnsembleArray.length > 0;
    }

    /**
     * Returns true if there are any delta ensembles in the set.
     * @returns True if there are any delta ensembles in the set.
     */
    hasAnyDeltaEnsembles(): boolean {
        return this._deltaEnsembleArray.length > 0;
    }

    /**
     * Returns true if there are any regular or delta ensembles in the set.
     * @returns True if there are any regular or delta ensembles in the set.
     */
    hasAnyEnsembles(): boolean {
        return this.hasAnyRegularEnsembles() || this.hasAnyDeltaEnsembles();
    }

    /**
     * Get an array of all regular ensembles in the set.
     * @returns An array of all regular ensembles in the set.
     */
    getRegularEnsembleArray(): readonly RegularEnsemble[] {
        return this._regularEnsembleArray;
    }

    /**
     * Get an array of all delta ensembles in the set.
     * @returns An array of all delta ensembles in the set.
     */
    getDeltaEnsembleArray(): readonly DeltaEnsemble[] {
        return this._deltaEnsembleArray;
    }

    /**
     * Get an array of all ensembles in the set.
     * @returns An array of all ensembles in the set.
     */
    getEnsembleArray(): readonly (RegularEnsemble | DeltaEnsemble)[] {
        return [...this._regularEnsembleArray, ...this._deltaEnsembleArray];
    }

    /**
     * Returns true if the ensemble set has the given ensemble ident.
     *
     * @param ensembleIdent - The ensemble ident to check for, can be either a regular or delta ensemble ident.
     * @returns True if the ensemble set has the given ensemble ident.
     */
    hasEnsemble(ensembleIdent: string): boolean {
        return this.findEnsemble(ensembleIdent) !== null;
    }

    /**
     * Find an ensemble in the set by its ensemble ident string
     */
    findEnsemble(ensembleIdent: string): RegularEnsemble | DeltaEnsemble | null {
        if (EnsembleIdent.isValidRegularEnsembleIdentString(ensembleIdent)) {
            return this._regularEnsembleArray.find((ens) => ens.getIdent() === ensembleIdent) ?? null;
        }
        if (EnsembleIdent.isValidDeltaEnsembleIdentString(ensembleIdent)) {
            return this._deltaEnsembleArray.find((ens) => ens.getIdent() === ensembleIdent) ?? null;
        }
        return null;
    }

    /**
     * Find regular ensemble by its ensemble ident string
     */
    findRegularEnsemble(ensembleIdent: string): RegularEnsemble | null {
        if (EnsembleIdent.isValidRegularEnsembleIdentString(ensembleIdent)) {
            return this._regularEnsembleArray.find((ens) => ens.getIdent() === ensembleIdent) ?? null;
        }
        return null;
    }

    /**
     * Find delta ensemble by its ensemble ident string
     */
    findDeltaEnsemble(ensembleIdent: string): DeltaEnsemble | null {
        if (EnsembleIdent.isValidDeltaEnsembleIdentString(ensembleIdent)) {
            return this._deltaEnsembleArray.find((ens) => ens.getIdent() === ensembleIdent) ?? null;
        }
        return null;
    }
}
