import { apiService } from "@framework/ApiService";
import { EnsembleIdent } from "@framework/EnsembleIdent";

import { atomWithQuery } from "jotai-tanstack-query";

import {
    selectedEnsembleIdentAtom,
    selectedRftResponseNameAtom,
    selectedRftTimestampsUtcMsAtom,
    selectedRftWellNameAtom,
} from "./derivedAtoms";

const STALE_TIME = 60 * 1000;
const CACHE_TIME = 60 * 1000;

export const rftTableDefinitionAtom = atomWithQuery((get) => {
    const selectedEnsembleIdent = get(selectedEnsembleIdentAtom);

    let caseUuid: string | null = null;
    let ensembleName: string | null = null;
    if (selectedEnsembleIdent && EnsembleIdent.isValidRegularEnsembleIdentString(selectedEnsembleIdent)) {
        ({ caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(selectedEnsembleIdent));
    }

    const query = {
        queryKey: ["getRftTableDefinition", caseUuid, ensembleName],
        queryFn: () => apiService.rft.getTableDefinition(caseUuid ?? "", ensembleName ?? ""),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!(caseUuid && ensembleName),
    };
    return query;
});

export const rftRealizationDataQueryAtom = atomWithQuery((get) => {
    const selectedEnsembleIdent = get(selectedEnsembleIdentAtom);
    const selectedWellName = get(selectedRftWellNameAtom);
    const selectedResponseName = get(selectedRftResponseNameAtom);
    const selectedRftTimestampsUtcMs = get(selectedRftTimestampsUtcMsAtom);

    let caseUuid: string | null = null;
    let ensembleName: string | null = null;
    if (selectedEnsembleIdent && EnsembleIdent.isValidRegularEnsembleIdentString(selectedEnsembleIdent)) {
        ({ caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(selectedEnsembleIdent));
    }

    const query = {
        queryKey: [
            "getRftRealizationData",
            caseUuid,
            ensembleName,
            selectedWellName,
            selectedResponseName,
            selectedRftTimestampsUtcMs,
        ],
        queryFn: () =>
            apiService.rft.getRealizationData(
                caseUuid ?? "",
                ensembleName ?? "",
                selectedWellName ?? "",
                selectedResponseName ?? "",
                selectedRftTimestampsUtcMs ? [selectedRftTimestampsUtcMs] : null
            ),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!(caseUuid && ensembleName && selectedWellName && selectedResponseName),
    };
    return query;
});
