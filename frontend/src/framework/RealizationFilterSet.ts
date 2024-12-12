import { EnsembleIdent } from "./EnsembleIdent";
import { EnsembleSet } from "./EnsembleSet";
import { RealizationFilter } from "./RealizationFilter";

export class RealizationFilterSet {
    // Map of ensembleIdent string to RealizationFilter
    private _ensembleIdentRealizationFilterMap: Map<string, RealizationFilter> = new Map();

    /**
     * The method is used to synchronize the realization filter set with the ensemble set.
     *
     * Removes filters for ensembles that are no longer in the ensemble set. Adds new default
     * filters for ensembles that are new to the ensemble set. Old are kept unchanged.
     */
    synchronizeWithEnsembleSet(ensembleSet: EnsembleSet): void {
        // Remove filters for ensembles that are no longer in the ensemble set
        for (const ensembleIdent of this._ensembleIdentRealizationFilterMap.keys()) {
            if (!EnsembleIdent.isValidEnsembleIdentString(ensembleIdent)) {
                throw new Error(`Invalid ensemble ident string: ${ensembleIdent}`);
            }

            if (!ensembleSet.hasEnsemble(ensembleIdent)) {
                this._ensembleIdentRealizationFilterMap.delete(ensembleIdent);
            }
        }

        // Add filters for ensembles that are new to the ensemble set
        for (const ensemble of ensembleSet.getEnsembleArray()) {
            const ensembleIdent = ensemble.getIdent();
            const isEnsembleInMap = this._ensembleIdentRealizationFilterMap.has(ensembleIdent);
            if (!isEnsembleInMap) {
                this._ensembleIdentRealizationFilterMap.set(ensembleIdent, new RealizationFilter(ensemble));
            }
        }
    }

    /**
     * Get filter for ensemble ident string
     */
    getRealizationFilterForEnsembleIdent(ensembleIdent: string): RealizationFilter {
        if (!EnsembleIdent.isValidEnsembleIdentString(ensembleIdent)) {
            throw new Error(`Invalid ensemble ident string: ${ensembleIdent}`);
        }

        const filter = this._ensembleIdentRealizationFilterMap.get(ensembleIdent);
        if (filter === undefined) {
            throw new Error(`We expect all ensembles to have a filter instance. No filter found for ${ensembleIdent}`);
        }

        return filter;
    }
}
