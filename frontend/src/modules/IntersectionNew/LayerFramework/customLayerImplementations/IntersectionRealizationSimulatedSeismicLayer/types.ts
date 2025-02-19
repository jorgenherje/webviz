import { RegularEnsembleIdent } from "@framework/RegularEnsembleIdent";
import { IntersectionSettingValue } from "@modules/_shared/LayerFramework/settings/implementations/IntersectionSetting";
import { SettingType } from "@modules/_shared/LayerFramework/settings/settingsTypes";

export type IntersectionRealizationSimulatedSeismicSettings = {
    [SettingType.INTERSECTION]: IntersectionSettingValue | null;
    [SettingType.ENSEMBLE]: RegularEnsembleIdent | null;
    [SettingType.REALIZATION]: number | null;
    [SettingType.ATTRIBUTE]: string | null;
    [SettingType.TIME_OR_INTERVAL]: string | null;
};
