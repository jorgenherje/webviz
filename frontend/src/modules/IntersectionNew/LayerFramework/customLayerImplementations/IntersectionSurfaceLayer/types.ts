import { RegularEnsembleIdent } from "@framework/RegularEnsembleIdent";
import { SettingType } from "@modules/_shared/LayerFramework/settings/settingsTypes";

export type IntersectionSurfaceSettings = {
    [SettingType.ENSEMBLE]: RegularEnsembleIdent | null;
    [SettingType.REALIZATION]: number | null;
    [SettingType.ATTRIBUTE]: string | null;
    // [SettingType.SURFACE_NAMES]: string[] | null;
    [SettingType.SURFACE_NAME]: string | null;
    [SettingType.SAMPLE_RESOLUTION_IN_METERS]: number | null;
};
