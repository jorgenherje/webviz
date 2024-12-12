import { FluidZone_api, InplaceVolumetricsIdentifierWithValues_api } from "@api";

export type InplaceVolumetricsFilter = {
    ensembleIdents: string[];
    tableNames: string[];
    fluidZones: FluidZone_api[];
    identifiersValues: InplaceVolumetricsIdentifierWithValues_api[];
};
