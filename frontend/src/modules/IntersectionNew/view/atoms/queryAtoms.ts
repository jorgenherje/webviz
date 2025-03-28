import { WellboreTrajectory_api, getWellTrajectoriesOptions, getWellboreCasingsOptions } from "@api";
import { IntersectionType } from "@framework/types/intersection";

import { atomWithQuery } from "jotai-tanstack-query";

import { selectedFieldIdentifierAtom } from "./baseAtoms";

export const wellboreTrajectoryQueryAtom = atomWithQuery((get) => {
    const intersectionSelection = get(selectedIntersectionSelectionAtom);
    const fieldIdentifier = get(selectedFieldIdentifierAtom);

    const isWellbore = intersectionSelection && intersectionSelection.type === IntersectionType.WELLBORE;
    const wellboreUuid = isWellbore ? intersectionSelection.uuid : null;

    const queryOptions = getWellTrajectoriesOptions({
        query: {
            field_identifier: fieldIdentifier ?? "",
            wellbore_uuids: wellboreUuid ? [wellboreUuid] : [],
        },
    });

    return {
        ...queryOptions,
        select: (data: WellboreTrajectory_api[]) => data[0],
        enabled: Boolean(wellboreUuid) && Boolean(fieldIdentifier),
    };
});

export const wellboreCasingQueryAtom = atomWithQuery((get) => {
    const intersectionSelection = get(selectedIntersectionSelectionAtom);

    const isWellbore = intersectionSelection && intersectionSelection.type === IntersectionType.WELLBORE;
    const wellboreUuid = isWellbore ? intersectionSelection.uuid : null;

    return {
        ...getWellboreCasingsOptions({
            query: {
                wellbore_uuid: wellboreUuid ?? "",
            },
        }),
        enabled: Boolean(wellboreUuid),
    };
});
