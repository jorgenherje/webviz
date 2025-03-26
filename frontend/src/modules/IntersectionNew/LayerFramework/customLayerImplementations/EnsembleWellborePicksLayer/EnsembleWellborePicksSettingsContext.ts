import { WellborePick_api, getWellborePicksInStratColumnOptions } from "@api";
import { IntersectionType } from "@framework/types/intersection";
import { SettingsContextDelegate } from "@modules/_shared/LayerFramework/delegates/SettingsContextDelegate";
import { LayerManager } from "@modules/_shared/LayerFramework/framework/LayerManager/LayerManager";
import { DefineDependenciesArgs, SettingsContext } from "@modules/_shared/LayerFramework/interfaces";
import { EnsembleSetting } from "@modules/_shared/LayerFramework/settings/implementations/EnsembleSetting";
import { ObjectSelectionSetting } from "@modules/_shared/LayerFramework/settings/implementations/ObjectSelectionSetting";
import { SingleStringChoiceSetting } from "@modules/_shared/LayerFramework/settings/implementations/SingleStringChoiceSetting";
import { SettingType } from "@modules/_shared/LayerFramework/settings/settingsTypes";

import _ from "lodash";

import { EnsembleWellborePicksSettings } from "./types";

export class EnsembleWellborePicksSettingsContext implements SettingsContext<EnsembleWellborePicksSettings> {
    private _contextDelegate: SettingsContextDelegate<EnsembleWellborePicksSettings>;

    constructor(layerManager: LayerManager) {
        const settings = {
            [SettingType.ENSEMBLE]: new EnsembleSetting(),
            [SettingType.SMDA_INTERPRETER]: new SingleStringChoiceSetting("Interpreter", SettingType.SMDA_INTERPRETER),
            [SettingType.WELLBORE_PICKS]: new ObjectSelectionSetting<WellborePick_api>(
                "Wellbore picks",
                SettingType.WELLBORE_PICKS,
                "pickIdentifier",
                "pickIdentifier"
            ),
        };

        this._contextDelegate = new SettingsContextDelegate<EnsembleWellborePicksSettings>(
            this,
            layerManager,
            settings
        );
    }

    getDelegate() {
        return this._contextDelegate;
    }

    areCurrentSettingsValid(settings: EnsembleWellborePicksSettings): boolean {
        return (
            settings[SettingType.ENSEMBLE] !== null &&
            settings[SettingType.SMDA_INTERPRETER] !== null &&
            settings[SettingType.WELLBORE_PICKS] !== null
        );
    }

    // ? This feels unintuitive? I find it strange to define what is essentially derived- and query-atoms with these methods.  Maybe its just the naming?
    // availableSettingsUpdater -> getSettingOptions ?
    // Feels a little like re-inventing the wheel...
    defineDependencies(args: DefineDependenciesArgs<EnsembleWellborePicksSettings>): void {
        const { helperDependency, availableSettingsUpdater, queryClient } = args;

        availableSettingsUpdater(SettingType.ENSEMBLE, ({ getGlobalSetting }) => {
            const fieldIdentifier = getGlobalSetting("fieldId");
            const ensembles = getGlobalSetting("ensembles");

            const ensembleIdents = ensembles
                .filter((ensemble) => ensemble.getFieldIdentifier() === fieldIdentifier)
                .map((ensemble) => ensemble.getIdent());

            return ensembleIdents;
        });

        const wellborePickOptions = helperDependency(({ getGlobalSetting, getLocalSetting, abortSignal }) => {
            const intersectionSelection = getGlobalSetting("intersectionSelection");
            const ensembles = getGlobalSetting("ensembles");
            const ensembleIdent = getLocalSetting(SettingType.ENSEMBLE);

            const wellboreUuid =
                intersectionSelection?.type === IntersectionType.WELLBORE ? intersectionSelection.uuid : null;
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

        availableSettingsUpdater(SettingType.SMDA_INTERPRETER, ({ getHelperDependency }) => {
            const wellborePicks = getHelperDependency(wellborePickOptions);

            if (!wellborePicks) return [];

            const picksByInterpreter = _.groupBy(wellborePicks, "interpreter");

            return _.keys(picksByInterpreter);
        });

        availableSettingsUpdater(SettingType.WELLBORE_PICKS, ({ getLocalSetting, getHelperDependency }) => {
            const wellborePicks = getHelperDependency(wellborePickOptions);
            const interpreter = getLocalSetting(SettingType.SMDA_INTERPRETER);

            if (!wellborePicks || !interpreter) return [];

            return _.filter(wellborePicks, ["interpreter", interpreter]);

            // TODO: Maybe merge the unit ones together?
            // const filteredPicks = _.filter(wellPicks, ["interpreter", interpreter]);

            // // @ts-expect-error - Complains about "lithology-type" but that field actually doesn't matter
            // const { nonUnitPicks, unitPicks } = transformFormationData(filteredPicks, pickUnits);

            // console.log(nonUnitPicks, unitPicks);

            // if (nonUnitPicks.length) {
            //     // ? Is this relevant for users, or? Should we propagate this to the ui?
            //     console.warn(`Found ${nonUnitPicks.length} non-unit picks!`, nonUnitPicks);
            // }

            // return unitPicks;
        });
    }
}
