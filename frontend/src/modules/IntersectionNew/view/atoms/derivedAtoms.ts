import { IntersectionReferenceSystem } from "@equinor/esv-intersection";
import { IntersectionType } from "@framework/types/intersection";

import { atom } from "jotai";

import { wellboreCasingQueryAtom, wellboreTrajectoryQueryAtom } from "./queryAtoms";

export const wellboreCasingDataAtom = atom((get) => {
    const wellboreCasingQuery = get(wellboreCasingQueryAtom);

    const wantedItemType = "Casing";
    const casingDataOfWantedItemType = wellboreCasingQuery.data?.filter((casing) => casing.itemType === wantedItemType);

    return casingDataOfWantedItemType ?? null;
});

export const intersectionReferenceSystemAtom = atom<IntersectionReferenceSystem | null>((get) => {
    const wellboreTrajectoryQuery = get(wellboreTrajectoryQueryAtom);
    const selectedCustomIntersectionPolyline = get(selectedCustomIntersectionPolylineAtom);
    const selectedIntersectionSelection = get(selectedIntersectionSelectionAtom);

    if (!selectedIntersectionSelection) {
        return null;
    }

    const wellboreTrajectory = wellboreTrajectoryQuery.data;
    if (selectedIntersectionSelection.type === IntersectionType.WELLBORE && wellboreTrajectory) {
        const path: number[][] = [];
        for (const [index, northing] of wellboreTrajectory.northingArr.entries()) {
            const easting = wellboreTrajectory.eastingArr[index];
            const tvd_msl = wellboreTrajectory.tvdMslArr[index];

            path.push([easting, northing, tvd_msl]);
        }
        const depthOffset = wellboreTrajectory.mdArr[0];

        const referenceSystem = new IntersectionReferenceSystem(path);
        referenceSystem.offset = depthOffset;

        return referenceSystem;
    }

    if (
        selectedIntersectionSelection.type === IntersectionType.CUSTOM_POLYLINE &&
        selectedCustomIntersectionPolyline &&
        selectedCustomIntersectionPolyline.path.length > 1
    ) {
        const referenceSystem = new IntersectionReferenceSystem(
            selectedCustomIntersectionPolyline.path.map((point) => [point[0], point[1], 0])
        );
        referenceSystem.offset = 0;

        return referenceSystem;
    }

    return null;
});
