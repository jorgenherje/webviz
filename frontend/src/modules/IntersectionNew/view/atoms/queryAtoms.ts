import { WellboreTrajectory_api, getWellTrajectoriesOptions } from "@api";
import { IntersectionType } from "@framework/types/intersection";

import { atomWithQuery } from "jotai-tanstack-query";

import { selectedFieldIdentifierAtom, selectedIntersectionSelectionAtom } from "./baseAtoms";

export const wellboreTrajectoryQueryAtom = atomWithQuery((get) => {
    const intersectionSelection = get(selectedIntersectionSelectionAtom);
    const fieldIdentifier = get(selectedFieldIdentifierAtom);

    const isWellbore = intersectionSelection && intersectionSelection.type === IntersectionType.WELLBORE;
    const wellbore_uuid = isWellbore ? intersectionSelection.uuid : null;

    const queryOptions = getWellTrajectoriesOptions({
        query: {
            field_identifier: fieldIdentifier ?? "",
            wellbore_uuids: wellbore_uuid ? [wellbore_uuid] : [],
        },
    });

    return {
        ...queryOptions,
        select: (data: WellboreTrajectory_api[]) => data[0],
        enabled: Boolean(wellbore_uuid) && Boolean(fieldIdentifier),
    };
});
