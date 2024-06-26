import { InplaceVolumetricsTableDefinition_api } from "@api";
import { apiService } from "@framework/ApiService";
import { atomWithQueries } from "@framework/utils/atomUtils";
import { UseQueryResult } from "@tanstack/react-query";

import { selectedEnsembleIdentsAtom } from "./derivedAtoms";

import { CombinedInplaceVolTableInfoResults } from "../../typesAndEnums";

const STALE_TIME = 60 * 1000;
const CACHE_TIME = 60 * 1000;

export const inplaceTableInfosQueryAtom = atomWithQueries((get) => {
    const selectedEnsembleIdents = get(selectedEnsembleIdentsAtom);

    const queries = selectedEnsembleIdents
        .map((ensembleIdent) => {
            return () => ({
                queryKey: ["inplaceTableDefinitions", ensembleIdent.toString()],
                queryFn: () =>
                    apiService.inplaceVolumetrics.getTableDefinitions(
                        ensembleIdent.getCaseUuid(),
                        ensembleIdent.getEnsembleName()
                    ),
                staleTime: STALE_TIME,
                gcTime: CACHE_TIME,
                enabled: Boolean(ensembleIdent),
            });
        })
        .flat();

    function combine(
        results: UseQueryResult<InplaceVolumetricsTableDefinition_api[], Error>[]
    ): CombinedInplaceVolTableInfoResults {
        return {
            tableInfoCollections: selectedEnsembleIdents.map((ensembleIdent, idx) => {
                return {
                    ensembleIdent: ensembleIdent,
                    tableInfos: results[idx]?.data ?? [],
                };
            }),
            isFetching: results.some((result) => result.isFetching),
            someQueriesFailed: results.some((result) => result.isError),
            allQueriesFailed: results.every((result) => result.isError),
        };
    }

    return {
        queries,
        combine,
    };
});