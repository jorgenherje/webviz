import { WellborePick_api } from "@api";
import { RegularEnsembleIdent } from "@framework/RegularEnsembleIdent";
import { SettingType } from "@modules/_shared/LayerFramework/settings/settingsTypes";

export type EnsembleWellborePicksSettings = {
    [SettingType.ENSEMBLE]: RegularEnsembleIdent | null;
    [SettingType.SMDA_INTERPRETER]: string | null;
    [SettingType.WELLBORE_PICKS]: WellborePick_api[] | null;
};
