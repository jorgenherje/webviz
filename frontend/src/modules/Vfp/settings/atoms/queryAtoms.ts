import { apiService } from "@framework/ApiService";
import { EnsembleIdent } from "@framework/EnsembleIdent";

import { atomWithQuery } from "jotai-tanstack-query";

import { selectedEnsembleIdentAtom, selectedRealizationNumberAtom, selectedVfpTableNameAtom } from "./derivedAtoms";

const STALE_TIME = 60 * 1000;
const CACHE_TIME = 60 * 1000;

export const vfpTableQueryAtom = atomWithQuery((get) => {
    const selectedEnsembleIdent = get(selectedEnsembleIdentAtom);
    const selectedRealizationNumber = get(selectedRealizationNumberAtom);
    const selectedVfpTableName = get(selectedVfpTableNameAtom);

    let caseUuid: string | null = null;
    let ensembleName: string | null = null;
    if (selectedEnsembleIdent && EnsembleIdent.isValidRegularEnsembleIdentString(selectedEnsembleIdent)) {
        ({ caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(selectedEnsembleIdent));
    }

    const query = {
        queryKey: ["getVfpTable", caseUuid, ensembleName, selectedRealizationNumber, selectedVfpTableName],
        queryFn: () =>
            apiService.vfp.getVfpTable(
                caseUuid ?? "",
                ensembleName ?? "",
                selectedRealizationNumber ?? 0,
                selectedVfpTableName ?? ""
            ),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!(caseUuid && ensembleName && selectedRealizationNumber !== null && selectedVfpTableName),
    };
    return query;
});

export const vfpTableNamesQueryAtom = atomWithQuery((get) => {
    const selectedEnsembleIdent = get(selectedEnsembleIdentAtom);
    const selectedRealizationNumber = get(selectedRealizationNumberAtom);

    let caseUuid: string | null = null;
    let ensembleName: string | null = null;
    if (selectedEnsembleIdent && EnsembleIdent.isValidRegularEnsembleIdentString(selectedEnsembleIdent)) {
        ({ caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(selectedEnsembleIdent));
    }

    const query = {
        queryKey: ["getVfpTableNames", caseUuid, ensembleName, selectedRealizationNumber],
        queryFn: () =>
            apiService.vfp.getVfpTableNames(caseUuid ?? "", ensembleName ?? "", selectedRealizationNumber ?? 0),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!(caseUuid && ensembleName && selectedRealizationNumber !== null),
    };
    return query;
});
