import { apiService } from "@framework/ApiService";
import { EnsembleIdent } from "@framework/EnsembleIdent";

import { atomWithQuery } from "jotai-tanstack-query";

import { selectedNodeTypesAtom, selectedResamplingFrequencyAtom } from "./baseAtoms";
import { selectedEnsembleIdentAtom, selectedRealizationNumberAtom } from "./derivedAtoms";

const STALE_TIME = 60 * 1000;
const CACHE_TIME = 60 * 1000;

export const realizationFlowNetworkQueryAtom = atomWithQuery((get) => {
    const selectedEnsembleIdent = get(selectedEnsembleIdentAtom);
    const selectedRealizationNumber = get(selectedRealizationNumberAtom);
    const selectedResamplingFrequency = get(selectedResamplingFrequencyAtom);
    const selectedNodeTypes = get(selectedNodeTypesAtom);

    let caseUuid: string | null = null;
    let ensembleName: string | null = null;
    if (selectedEnsembleIdent && EnsembleIdent.isValidRegularEnsembleIdentString(selectedEnsembleIdent)) {
        ({ caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(selectedEnsembleIdent));
    }

    const query = {
        queryKey: [
            "getRealizationFlowNetwork",
            caseUuid,
            ensembleName,
            selectedRealizationNumber,
            selectedResamplingFrequency,
            Array.from(selectedNodeTypes),
        ],
        queryFn: () =>
            apiService.flowNetwork.getRealizationFlowNetwork(
                caseUuid ?? "",
                ensembleName ?? "",
                selectedRealizationNumber ?? 0,
                selectedResamplingFrequency,
                Array.from(selectedNodeTypes)
            ),
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        enabled: !!(caseUuid && ensembleName && selectedRealizationNumber !== null && selectedNodeTypes.size > 0),
    };
    return query;
});
