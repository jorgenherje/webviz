import { SurfaceAttributeType_api, getRealizationSurfacesMetadataOptions } from "@api";
import { SettingsContextDelegate } from "@modules/_shared/LayerFramework/delegates/SettingsContextDelegate";
import { LayerManager } from "@modules/_shared/LayerFramework/framework/LayerManager/LayerManager";
import { DefineDependenciesArgs, SettingsContext } from "@modules/_shared/LayerFramework/interfaces";
import { AttributeSetting } from "@modules/_shared/LayerFramework/settings/implementations/AttributeSetting";
import { EnsembleSetting } from "@modules/_shared/LayerFramework/settings/implementations/EnsembleSetting";
import { RealizationSetting } from "@modules/_shared/LayerFramework/settings/implementations/RealizationSetting";
import { SampleResolutionInMetersSetting } from "@modules/_shared/LayerFramework/settings/implementations/SampleResolutionInMetersSetting";
import { StringSelectionSetting } from "@modules/_shared/LayerFramework/settings/implementations/StringSelectionSetting";
import { SurfaceNameSetting } from "@modules/_shared/LayerFramework/settings/implementations/SurfaceNameSetting";
import { SettingType } from "@modules/_shared/LayerFramework/settings/settingsTypes";

import { IntersectionSurfaceSettings } from "./types";

export class IntersectionSurfaceSettingsContext implements SettingsContext<IntersectionSurfaceSettings> {
    private _contextDelegate: SettingsContextDelegate<IntersectionSurfaceSettings>;

    constructor(layerManager: LayerManager) {
        const settings = {
            [SettingType.ENSEMBLE]: new EnsembleSetting(),
            [SettingType.REALIZATION]: new RealizationSetting(),
            [SettingType.ATTRIBUTE]: new AttributeSetting(),
            // [SettingType.SURFACE_NAMES]: new StringSelectionSetting("Surface Names", SettingType.SURFACE_NAMES, true),
            [SettingType.SURFACE_NAME]: new SurfaceNameSetting(),
            [SettingType.SAMPLE_RESOLUTION_IN_METERS]: new SampleResolutionInMetersSetting(),
        };

        this._contextDelegate = new SettingsContextDelegate<IntersectionSurfaceSettings>(this, layerManager, settings);
    }

    getDelegate() {
        return this._contextDelegate;
    }

    areCurrentSettingsValid(settings: IntersectionSurfaceSettings): boolean {
        return (
            settings[SettingType.ENSEMBLE] !== null &&
            settings[SettingType.REALIZATION] !== null &&
            settings[SettingType.ATTRIBUTE] !== null &&
            // settings[SettingType.SURFACE_NAMES] !== null &&
            settings[SettingType.SURFACE_NAME] !== null &&
            settings[SettingType.SAMPLE_RESOLUTION_IN_METERS] !== null
        );
    }

    defineDependencies({
        helperDependency,
        availableSettingsUpdater,
        queryClient,
    }: DefineDependenciesArgs<IntersectionSurfaceSettings>) {
        availableSettingsUpdater(SettingType.ENSEMBLE, ({ getGlobalSetting }) => {
            const fieldIdentifier = getGlobalSetting("fieldId");
            const ensembles = getGlobalSetting("ensembles");

            const ensembleIdentsForField = ensembles
                .filter((ensemble) => ensemble.getFieldIdentifier() === fieldIdentifier)
                .map((ensemble) => ensemble.getIdent());

            return ensembleIdentsForField;
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

        const depthSurfaceMetadataDep = helperDependency(async ({ getLocalSetting, abortSignal }) => {
            const ensembleIdent = getLocalSetting(SettingType.ENSEMBLE);

            if (!ensembleIdent) {
                return null;
            }

            const surfaceMetadata = await queryClient.fetchQuery({
                ...getRealizationSurfacesMetadataOptions({
                    query: {
                        case_uuid: ensembleIdent.getCaseUuid(),
                        ensemble_name: ensembleIdent.getEnsembleName(),
                    },
                    signal: abortSignal,
                }),
            });

            const depthSurfacesMetadata = surfaceMetadata.surfaces.filter(
                (elm) => elm.attribute_type === SurfaceAttributeType_api.DEPTH
            );
            return depthSurfacesMetadata;
        });

        availableSettingsUpdater(SettingType.ATTRIBUTE, ({ getHelperDependency }) => {
            const depthSurfacesMetadata = getHelperDependency(depthSurfaceMetadataDep);

            if (!depthSurfacesMetadata) {
                return [];
            }

            return Array.from(new Set(depthSurfacesMetadata.map((elm) => elm.attribute_name)));
        });

        // availableSettingsUpdater(SettingType.SURFACE_NAMES, ({ getHelperDependency }) => {
        availableSettingsUpdater(SettingType.SURFACE_NAME, ({ getHelperDependency }) => {
            const depthSurfacesMetadata = getHelperDependency(depthSurfaceMetadataDep);

            if (!depthSurfacesMetadata) {
                return [];
            }

            return Array.from(new Set(depthSurfacesMetadata.map((elm) => elm.name)));
        });

        availableSettingsUpdater(SettingType.SAMPLE_RESOLUTION_IN_METERS, () => {
            const maxResolutionSelection = 100;
            return [maxResolutionSelection];
        });
    }
}
