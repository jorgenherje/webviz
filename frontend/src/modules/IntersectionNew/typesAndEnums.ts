export const CURVE_FITTING_EPSILON = 5; // meter

export enum PreferredViewLayout {
    HORIZONTAL = "horizontal",
    VERTICAL = "vertical",
}

export type WellboreHeader = {
    uuid: string;
    identifier: string;
    depthReferencePoint: string;
    depthReferenceElevation: number;
};
