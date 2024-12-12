import { apiService } from "@framework/ApiService";
import { EnsembleIdent } from "@framework/EnsembleIdent";
import { EnsembleSetAtom } from "@framework/GlobalAtoms";

import { atomWithQuery } from "jotai-tanstack-query";

import { selectedEnsembleIdentAtom, selectedRealizationAtom } from "./derivedAtoms";

const STALE_TIME = 60 * 1000;
const CACHE_TIME = 60 * 1000;

export const gridModelInfosQueryAtom = atomWithQuery((get) => {
    const ensembleIdent = get(selectedEnsembleIdentAtom);
    const realizationNumber = get(selectedRealizationAtom);

    let caseUuid = "";
    let ensembleName = "";
    if (ensembleIdent && EnsembleIdent.isValidRegularEnsembleIdentString(ensembleIdent)) {
        ({ caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(ensembleIdent));
    }

    return {
        queryKey: ["getGridModelInfos", caseUuid, ensembleName, realizationNumber],
        queryFn: () => apiService.grid3D.getGridModelsInfo(caseUuid, ensembleName, realizationNumber ?? 0),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: Boolean(caseUuid && ensembleName && realizationNumber !== null),
    };
});

export const drilledWellboreHeadersQueryAtom = atomWithQuery((get) => {
    const ensembleIdent = get(selectedEnsembleIdentAtom);
    const ensembleSet = get(EnsembleSetAtom);

    let fieldIdentifier: string | null = null;
    if (ensembleIdent) {
        const ensemble = ensembleSet.findRegularEnsemble(ensembleIdent);
        if (ensemble) {
            fieldIdentifier = ensemble.getFieldIdentifier();
        }
    }

    return {
        queryKey: ["getDrilledWellboreHeaders", fieldIdentifier],
        queryFn: () => apiService.well.getDrilledWellboreHeaders(fieldIdentifier ?? ""),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: Boolean(fieldIdentifier),
    };
});
