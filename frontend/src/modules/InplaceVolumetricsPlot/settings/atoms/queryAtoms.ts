import { InplaceVolumetricsTableDefinition_api } from "@api";
import { apiService } from "@framework/ApiService";
import { EnsembleIdent } from "@framework/EnsembleIdent";
import { atomWithQueries } from "@framework/utils/atomUtils";
import { QueryObserverResult } from "@tanstack/query-core";

import { selectedEnsembleIdentsAtom } from "./derivedAtoms";

const STALE_TIME = 60 * 1000;
const CACHE_TIME = 60 * 1000;

export type TableDefinitionsQueryResult = {
    data: {
        ensembleIdent: string;
        tableDefinitions: InplaceVolumetricsTableDefinition_api[];
    }[];
    isLoading: boolean;
};

export const tableDefinitionsQueryAtom = atomWithQueries((get) => {
    const selectedEnsembleIdents = get(selectedEnsembleIdentsAtom);

    const queries = selectedEnsembleIdents.map((ensembleIdent) => {
        let caseUuid = "";
        let ensembleName = "";
        if (EnsembleIdent.isValidRegularEnsembleIdentString(ensembleIdent)) {
            ({ caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(ensembleIdent));
        }

        return () => ({
            queryKey: ["tableDefinitions", ensembleIdent],
            queryFn: () => apiService.inplaceVolumetrics.getTableDefinitions(caseUuid, ensembleName),
            staleTime: STALE_TIME,
            gcTime: CACHE_TIME,
        });
    });

    return {
        queries,
        combine: (
            results: QueryObserverResult<InplaceVolumetricsTableDefinition_api[], Error>[]
        ): TableDefinitionsQueryResult => {
            const tableDefinitionsPerEnsembleIdent: TableDefinitionsQueryResult["data"] = results.map(
                (result, index) => ({
                    ensembleIdent: selectedEnsembleIdents[index],
                    tableDefinitions: result.data ?? [],
                })
            );
            const someLoading = results.some((result) => result.isLoading);
            return {
                data: tableDefinitionsPerEnsembleIdent,
                isLoading: someLoading,
            };
        },
    };
});
