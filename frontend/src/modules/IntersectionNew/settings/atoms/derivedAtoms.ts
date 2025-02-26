import { EnsembleSetAtom } from "@framework/GlobalAtoms";
import { IntersectionType } from "@framework/types/intersection";
import { IntersectionPolylinesAtom } from "@framework/userCreatedItems/IntersectionPolylines";
import { IntersectionSelection } from "@modules/_shared/components/IntersectionSelector/intersectionSelector";

import { atom } from "jotai";

import { userSelectedFieldIdentifierAtom, userSelectedIntersectionSelectionAtom } from "./baseAtoms";
import { drilledWellboreHeadersQueryAtom } from "./queryAtoms";

export const selectedFieldIdentifierAtom = atom((get) => {
    const ensembleSet = get(EnsembleSetAtom);
    const userSelectedField = get(userSelectedFieldIdentifierAtom);

    if (
        !userSelectedField ||
        !ensembleSet.getRegularEnsembleArray().some((ens) => ens.getFieldIdentifier() === userSelectedField)
    ) {
        return ensembleSet.getRegularEnsembleArray().at(0)?.getFieldIdentifier() ?? null;
    }

    return userSelectedField;
});

export const isFetchingAvailableWellboreHeadersAtom = atom<boolean>((get) => {
    const drilledWellboreHeaders = get(drilledWellboreHeadersQueryAtom);
    return drilledWellboreHeaders.isFetching;
});

export const hasErrorAvailableWellboreHeadersAtom = atom<boolean>((get) => {
    const drilledWellboreHeaders = get(drilledWellboreHeadersQueryAtom);
    return drilledWellboreHeaders.isError;
});

export const availableIntersectionSelectionsAtom = atom<IntersectionSelection[]>((get) => {
    const availableWellboreHeaders = get(drilledWellboreHeadersQueryAtom);
    const userCreatedIntersectionPolylines = get(IntersectionPolylinesAtom);

    if (!availableWellboreHeaders.data) {
        return [];
    }

    const availableIntersectionSelections: IntersectionSelection[] = [];
    for (const wellboreHeader of availableWellboreHeaders.data) {
        availableIntersectionSelections.push({
            type: IntersectionType.WELLBORE,
            name: wellboreHeader.uniqueWellboreIdentifier,
            uuid: wellboreHeader.wellboreUuid,
        });
    }
    for (const polyline of userCreatedIntersectionPolylines) {
        availableIntersectionSelections.push({
            type: IntersectionType.CUSTOM_POLYLINE,
            name: polyline.name,
            uuid: polyline.id,
        });
    }

    return availableIntersectionSelections;
});

export const selectedIntersectionSelectionAtom = atom<IntersectionSelection | null>((get) => {
    const userSelectedIntersectionSelection = get(userSelectedIntersectionSelectionAtom);
    const availableIntersectionSelections = get(availableIntersectionSelectionsAtom);

    if (!userSelectedIntersectionSelection) {
        return null;
    }

    const selectedIntersectionExists = availableIntersectionSelections.some(
        (elm) =>
            elm.uuid === userSelectedIntersectionSelection.uuid && elm.type === userSelectedIntersectionSelection.type
    );

    return selectedIntersectionExists ? userSelectedIntersectionSelection : null;
});
