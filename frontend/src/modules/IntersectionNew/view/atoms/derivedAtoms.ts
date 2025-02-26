import { IntersectionReferenceSystem } from "@equinor/esv-intersection";
import { IntersectionType } from "@framework/types/intersection";
import { IntersectionPolylinesAtom } from "@framework/userCreatedItems/IntersectionPolylines";

import { atom } from "jotai";

import { selectedIntersectionSelectionAtom } from "./baseAtoms";
import { wellboreTrajectoryQueryAtom } from "./queryAtoms";

export const selectedCustomIntersectionPolylineAtom = atom((get) => {
    const selectedIntersectionSelection = get(selectedIntersectionSelectionAtom);
    const customIntersectionPolylines = get(IntersectionPolylinesAtom);

    if (!selectedIntersectionSelection || selectedIntersectionSelection.type !== IntersectionType.CUSTOM_POLYLINE) {
        return null;
    }

    return customIntersectionPolylines.find((el) => el.id === selectedIntersectionSelection.uuid) ?? null;
});

export const selectedWellboreHeaderUuidAtom = atom<string | null>((get) => {
    const selectedIntersectionSelection = get(selectedIntersectionSelectionAtom);

    if (!selectedIntersectionSelection || selectedIntersectionSelection.type !== IntersectionType.WELLBORE) {
        return null;
    }
    return selectedIntersectionSelection.uuid;
});

export const intersectionReferenceSystemAtom = atom<IntersectionReferenceSystem | null>((get) => {
    const wellboreTrajectoryQuery = get(wellboreTrajectoryQueryAtom);
    const selectedCustomIntersectionPolyline = get(selectedCustomIntersectionPolylineAtom);
    const selectedIntersectionSelection = get(selectedIntersectionSelectionAtom);

    if (!selectedIntersectionSelection) {
        return null;
    }

    if (selectedIntersectionSelection.type === IntersectionType.WELLBORE) {
        if (!wellboreTrajectoryQuery.data) {
            return null;
        }

        const wellboreTrajectory = wellboreTrajectoryQuery.data;

        if (wellboreTrajectoryQuery) {
            const path: number[][] = [];
            for (const [index, northing] of wellboreTrajectory.northingArr.entries()) {
                const easting = wellboreTrajectory.eastingArr[index];
                const tvd_msl = wellboreTrajectory.tvdMslArr[index];

                path.push([easting, northing, tvd_msl]);
            }
            const offset = wellboreTrajectory.mdArr[0];

            const referenceSystem = new IntersectionReferenceSystem(path);
            referenceSystem.offset = offset;

            return referenceSystem;
        }
    } else if (
        selectedIntersectionSelection.type === IntersectionType.CUSTOM_POLYLINE &&
        selectedCustomIntersectionPolyline
    ) {
        if (selectedCustomIntersectionPolyline.path.length < 2) {
            return null;
        }
        const referenceSystem = new IntersectionReferenceSystem(
            selectedCustomIntersectionPolyline.path.map((point) => [point[0], point[1], 0])
        );
        referenceSystem.offset = 0;

        return referenceSystem;
    }

    return null;
});
