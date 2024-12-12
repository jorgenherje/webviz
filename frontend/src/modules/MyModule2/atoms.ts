import { apiService } from "@framework/ApiService";
import { EnsembleSetAtom } from "@framework/GlobalAtoms";

import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";

export const textAtom = atom<string>("I am an atom with text!");
export const selectedEnsembleIdentAtom = atom<string | null>(null);
export const vectorsAtom = atomWithQuery((get) => {
    const ensembleSet = get(EnsembleSetAtom);
    const selectedEnsembleIdent = get(selectedEnsembleIdentAtom);

    const selectedEnsemble = selectedEnsembleIdent
        ? ensembleSet.findRegularEnsemble(selectedEnsembleIdent) ?? null
        : null;
    const caseUuid = selectedEnsemble?.getCaseUuid();
    const ensembleName = selectedEnsemble?.getEnsembleName();

    return {
        queryKey: ["ensembles", get(selectedEnsembleIdentAtom)?.toString()],
        queryFn: () => apiService.timeseries.getVectorList(caseUuid ?? "", ensembleName ?? ""),
    };
});
export const atomBasedOnVectors = atom<boolean>((get) => get(vectorsAtom).isFetching);
export const userSelectedVectorAtom = atom<string | null>(null);
export const selectedVectorAtom = atom<string | null>((get) => {
    const vectors = get(vectorsAtom);
    const userSelectedVector = get(userSelectedVectorAtom);

    if (userSelectedVector && vectors.data) {
        if (vectors.data.some((vector) => vector.name === userSelectedVector)) {
            return userSelectedVector;
        }
    }

    return vectors.data?.at(0)?.name ?? null;
});
