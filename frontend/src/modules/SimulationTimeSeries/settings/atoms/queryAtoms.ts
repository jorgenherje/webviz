import { apiService } from "@framework/ApiService";
import { EnsembleIdent } from "@framework/EnsembleIdent";
import { atomWithQueries } from "@framework/utils/atomUtils";

import { selectedEnsembleIdentsAtom } from "./derivedAtoms";

const STALE_TIME = 60 * 1000;
const CACHE_TIME = 60 * 1000;

export const vectorListQueriesAtom = atomWithQueries((get) => {
    const selectedEnsembleIdents = get(selectedEnsembleIdentsAtom);

    const queries = selectedEnsembleIdents.map((ensembleIdent) => {
        // Regular Ensemble
        if (EnsembleIdent.isValidRegularEnsembleIdentString(ensembleIdent)) {
            const { caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(ensembleIdent);

            return () => ({
                queryKey: ["getVectorList", ensembleIdent],
                queryFn: () => apiService.timeseries.getVectorList(caseUuid, ensembleName),
                staleTime: STALE_TIME,
                gcTime: CACHE_TIME,
            });
        }

        // Delta Ensemble
        if (!EnsembleIdent.isValidDeltaEnsembleIdentString(ensembleIdent)) {
            throw new Error(`Invalid delta ensemble ident string: ${ensembleIdent}`);
        }
        const { compareEnsemble, referenceEnsemble } =
            EnsembleIdent.deltaEnsembleCaseUuidsAndNamesFromString(ensembleIdent);

        return () => ({
            queryKey: ["getDeltaEnsembleVectorList", ensembleIdent],
            queryFn: () =>
                apiService.timeseries.getDeltaEnsembleVectorList(
                    compareEnsemble.caseUuid,
                    compareEnsemble.ensembleName,
                    referenceEnsemble.caseUuid,
                    referenceEnsemble.ensembleName
                ),
            staleTime: STALE_TIME,
            gcTime: CACHE_TIME,
        });
    });

    return {
        queries,
    };
});
