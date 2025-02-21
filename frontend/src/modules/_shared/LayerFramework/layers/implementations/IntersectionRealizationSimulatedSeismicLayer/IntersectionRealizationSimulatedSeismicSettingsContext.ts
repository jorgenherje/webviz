import { getSeismicCubeMetaListOptions } from "@api";
import { SettingsContextDelegate } from "@modules/_shared/LayerFramework/delegates/SettingsContextDelegate";
import { LayerManager } from "@modules/_shared/LayerFramework/framework/LayerManager/LayerManager";
import { DefineDependenciesArgs, SettingsContext } from "@modules/_shared/LayerFramework/interfaces";
import { AttributeSetting } from "@modules/_shared/LayerFramework/settings/implementations/AttributeSetting";
import { EnsembleSetting } from "@modules/_shared/LayerFramework/settings/implementations/EnsembleSetting";
import { IntersectionExtensionLengthSetting } from "@modules/_shared/LayerFramework/settings/implementations/IntersectionExtensionLengthSetting";
import { IntersectionSetting } from "@modules/_shared/LayerFramework/settings/implementations/IntersectionSetting";
import { RealizationSetting } from "@modules/_shared/LayerFramework/settings/implementations/RealizationSetting";
import { TimeOrIntervalSetting } from "@modules/_shared/LayerFramework/settings/implementations/TimeOrIntervalSetting";
import { SettingType } from "@modules/_shared/LayerFramework/settings/settingsTypes";

import { IntersectionRealizationSimulatedSeismicSettings } from "./types";

export class IntersectionRealizationSimulatedSeismicSettingsContext
    implements SettingsContext<IntersectionRealizationSimulatedSeismicSettings>
{
    private _contextDelegate: SettingsContextDelegate<IntersectionRealizationSimulatedSeismicSettings>;

    constructor(layerManager: LayerManager) {
        this._contextDelegate = new SettingsContextDelegate<IntersectionRealizationSimulatedSeismicSettings>(
            this,
            layerManager,
            {
                [SettingType.INTERSECTION]: new IntersectionSetting(),
                [SettingType.ENSEMBLE]: new EnsembleSetting(),
                [SettingType.REALIZATION]: new RealizationSetting(),
                [SettingType.ATTRIBUTE]: new AttributeSetting(),
                [SettingType.TIME_OR_INTERVAL]: new TimeOrIntervalSetting(),
                [SettingType.INTERSECTION_EXTENSION_LENGTH]: new IntersectionExtensionLengthSetting(),
            }
        );
    }

    areCurrentSettingsValid(settings: IntersectionRealizationSimulatedSeismicSettings): boolean {
        return (
            settings[SettingType.INTERSECTION] !== null &&
            settings[SettingType.ENSEMBLE] !== null &&
            settings[SettingType.REALIZATION] !== null &&
            settings[SettingType.ATTRIBUTE] !== null &&
            settings[SettingType.TIME_OR_INTERVAL] !== null &&
            settings[SettingType.INTERSECTION_EXTENSION_LENGTH] !== null
        );
    }

    getDelegate(): SettingsContextDelegate<IntersectionRealizationSimulatedSeismicSettings> {
        return this._contextDelegate;
    }

    getSettings() {
        return this._contextDelegate.getSettings();
    }

    defineDependencies({
        helperDependency,
        availableSettingsUpdater,
        // storedDataUpdater,
        queryClient,
    }: DefineDependenciesArgs<IntersectionRealizationSimulatedSeismicSettings>) {
        availableSettingsUpdater(SettingType.ENSEMBLE, ({ getGlobalSetting }) => {
            const fieldIdentifier = getGlobalSetting("fieldId");
            const ensembles = getGlobalSetting("ensembles");

            const ensembleIdents = ensembles
                .filter((ensemble) => ensemble.getFieldIdentifier() === fieldIdentifier)
                .map((ensemble) => ensemble.getIdent());

            return ensembleIdents;
        });

        availableSettingsUpdater(SettingType.REALIZATION, ({ getLocalSetting, getGlobalSetting }) => {
            const ensembleIdent = getLocalSetting(SettingType.ENSEMBLE);
            const realizationFilterFunc = getGlobalSetting("realizationFilterFunction");

            if (!ensembleIdent) {
                return [];
            }

            const realizations = realizationFilterFunc(ensembleIdent);

            return [...realizations];
        });

        const ensembleSeismicCubeMetaListDep = helperDependency(async ({ getLocalSetting, abortSignal }) => {
            const ensembleIdent = getLocalSetting(SettingType.ENSEMBLE);

            if (!ensembleIdent) {
                return null;
            }

            return await queryClient.fetchQuery({
                ...getSeismicCubeMetaListOptions({
                    query: {
                        case_uuid: ensembleIdent?.getCaseUuid() ?? "",
                        ensemble_name: ensembleIdent?.getEnsembleName() ?? "",
                    },

                    signal: abortSignal,
                }),
            });
        });

        // storedDataUpdater("seismicCubeMetaList", ({ getHelperDependency }) => {
        //     const data = getHelperDependency(ensembleSeismicCubeMetaListDep);

        //     if (!data) {
        //         return null;
        //     }

        //     return data;
        // });

        availableSettingsUpdater(SettingType.ATTRIBUTE, ({ getHelperDependency }) => {
            const seismicCubeMetaList = getHelperDependency(ensembleSeismicCubeMetaListDep);

            if (!seismicCubeMetaList) {
                return [];
            }

            // Get seismic attributes that are depth and not observation
            const availableAttributes = Array.from(
                new Set(
                    seismicCubeMetaList.filter((el) => el.isDepth && !el.isObservation).map((el) => el.seismicAttribute)
                )
            );

            return availableAttributes;
        });

        availableSettingsUpdater(SettingType.TIME_OR_INTERVAL, ({ getLocalSetting, getHelperDependency }) => {
            const seismicCubeMetaList = getHelperDependency(ensembleSeismicCubeMetaListDep);
            const seismicAttribute = getLocalSetting(SettingType.ATTRIBUTE);

            if (!seismicAttribute || !seismicCubeMetaList) {
                return [];
            }

            const availableTimeOrIntervals = [
                ...Array.from(
                    new Set(
                        seismicCubeMetaList
                            .filter((surface) => surface.seismicAttribute === seismicAttribute)
                            .map((el) => el.isoDateOrInterval)
                    )
                ),
            ];

            return availableTimeOrIntervals;
        });
    }
}
