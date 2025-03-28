import { WellborePick_api, getWellborePicksInStratColumnOptions } from "@api";
import { IntersectionType } from "@framework/types/intersection";
import {
    CustomDataLayerImplementation,
    FetchDataParams,
} from "@modules/_shared/LayerFramework/interfacesAndTypes/customDataLayerImplementation";
import { DefineDependenciesArgs } from "@modules/_shared/LayerFramework/interfacesAndTypes/customSettingsHandler";
import { MakeSettingTypesMap, Setting } from "@modules/_shared/LayerFramework/settings/settingsDefinitions";

import { filter, groupBy, isEqual, keys } from "lodash";

const ensembleWellborePicksSettings = [
    Setting.INTERSECTION,
    Setting.ENSEMBLE,
    Setting.WELLBORE_PICK_IDENTIFIER,
    Setting.WELLBORE_PICKS,
] as const;
export type EnsembleWellborePicksSettings = typeof ensembleWellborePicksSettings;
type SettingsWithTypes = MakeSettingTypesMap<EnsembleWellborePicksSettings>;

export type EnsembleWellborePicksData = WellborePick_api[];

export class EnsembleWellborePicksLayer
    implements CustomDataLayerImplementation<EnsembleWellborePicksSettings, EnsembleWellborePicksData>
{
    settings = ensembleWellborePicksSettings;

    getDefaultName() {
        return "Wellbore Picks";
    }

    doSettingsChangesRequireDataRefetch(prevSettings: SettingsWithTypes, newSettings: SettingsWithTypes): boolean {
        return !isEqual(prevSettings, newSettings);
    }

    makeValueRange(): [number, number] | null {
        return null;
    }

    defineDependencies({
        helperDependency,
        availableSettingsUpdater,
        storedDataUpdater,
        queryClient,
    }: DefineDependenciesArgs<EnsembleWellborePicksSettings>): void {
        availableSettingsUpdater(Setting.ENSEMBLE, ({ getGlobalSetting }) => {
            const fieldIdentifier = getGlobalSetting("fieldId");
            const ensembles = getGlobalSetting("ensembles");

            const ensembleIdents = ensembles
                .filter((ensemble) => ensemble.getFieldIdentifier() === fieldIdentifier)
                .map((ensemble) => ensemble.getIdent());

            return ensembleIdents;
        });

        const wellborePicksDep = helperDependency(({ getGlobalSetting, getLocalSetting, abortSignal }) => {
            const ensembles = getGlobalSetting("ensembles");
            const ensembleIdent = getLocalSetting(Setting.ENSEMBLE);
            const intersection = getLocalSetting(Setting.INTERSECTION);

            const wellboreUuid = intersection?.type === IntersectionType.WELLBORE ? intersection.uuid : null;
            const stratColumn = ensembles
                .find((ensemble) => ensemble.getIdent().equals(ensembleIdent))
                ?.getStratigraphicColumnIdentifier();

            if (!wellboreUuid || !stratColumn) {
                return null;
            }

            return queryClient.fetchQuery({
                ...getWellborePicksInStratColumnOptions({
                    query: { wellbore_uuid: wellboreUuid, strat_column_identifier: stratColumn },
                    signal: abortSignal,
                }),
            });
        });

        availableSettingsUpdater(Setting.WELLBORE_PICK_IDENTIFIER, ({ getHelperDependency }) => {
            const wellborePicks = getHelperDependency(wellborePicksDep);

            if (!wellborePicks) return [];

            const picksByInterpreter = groupBy(wellborePicks, "interpreter");

            return keys(picksByInterpreter);
        });

        availableSettingsUpdater(Setting.WELLBORE_PICKS, ({ getLocalSetting, getHelperDependency }) => {
            const wellborePicks = getHelperDependency(wellborePicksDep);
            const interpreter = getLocalSetting(Setting.WELLBORE_PICK_IDENTIFIER);

            if (!wellborePicks || !interpreter) {
                return [];
            }

            return filter(wellborePicks, ["interpreter", interpreter]);
        });
    }

    fetchData({
        getSetting,
    }: FetchDataParams<EnsembleWellborePicksSettings, EnsembleWellborePicksData>): Promise<EnsembleWellborePicksData> {
        const selectedWellborePicks = getSetting(Setting.WELLBORE_PICKS) ?? [];

        // TODO:
        // Settings: unique combination of interpreter + pick identifier
        // Fetch wellbore picks in strat column and filter with selected interpreter and pick identifiers here
        // The fetched data is cached bu tanstack query, rather than storing the picks in StoredData

        // ! Not actually any reason for this to be a promise.
        // No data to fetch, it's already available in the well-picks
        return new Promise((resolve) => {
            resolve(selectedWellborePicks);
        });
    }
}
