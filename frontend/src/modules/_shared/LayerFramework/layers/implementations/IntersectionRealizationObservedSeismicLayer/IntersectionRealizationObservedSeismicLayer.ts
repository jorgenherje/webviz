import { postGetSeismicFenceOptions } from "@api";
import {
    createResampledPolylineXyUtm,
    makeIntersectionPolylineXyUtmPromiseForDelegate,
} from "@modules/_shared/Intersection/intersectionPolylineUtils";
import {
    SeismicPolylineAndFenceData,
    createTransformedSeismicPolylineAndFenceData,
} from "@modules/_shared/Intersection/seismicIntersectionTransform";
import { createSeismicFencePolylineFromPolylineXy } from "@modules/_shared/Intersection/seismicIntersectionUtils";
import { ItemDelegate } from "@modules/_shared/LayerFramework/delegates/ItemDelegate";
import { LayerColoringType, LayerDelegate } from "@modules/_shared/LayerFramework/delegates/LayerDelegate";
import { LayerManager } from "@modules/_shared/LayerFramework/framework/LayerManager/LayerManager";
import { BoundingBox, Layer, SerializedLayer } from "@modules/_shared/LayerFramework/interfaces";
import { LayerRegistry } from "@modules/_shared/LayerFramework/layers/LayerRegistry";
import { SettingType } from "@modules/_shared/LayerFramework/settings/settingsTypes";
import { QueryClient } from "@tanstack/query-core";

import { isEqual } from "lodash";

import { IntersectionRealizationObservedSeismicSettingsContext } from "./IntersectionRealizationObservedSeismicSettingsContext";
import { IntersectionRealizationObservedSeismicSettings } from "./types";

export class IntersectionRealizationObservedSeismicLayer
    implements Layer<IntersectionRealizationObservedSeismicSettings, SeismicPolylineAndFenceData>
{
    private _layerDelegate: LayerDelegate<IntersectionRealizationObservedSeismicSettings, SeismicPolylineAndFenceData>;
    private _itemDelegate: ItemDelegate;

    constructor(layerManager: LayerManager) {
        this._itemDelegate = new ItemDelegate("Intersection Realization Observed Seismic", layerManager);
        this._layerDelegate = new LayerDelegate(
            this,
            layerManager,
            new IntersectionRealizationObservedSeismicSettingsContext(layerManager),
            LayerColoringType.COLORSCALE
        );
    }

    getSettingsContext() {
        return this._layerDelegate.getSettingsContext();
    }

    getItemDelegate(): ItemDelegate {
        return this._itemDelegate;
    }

    getLayerDelegate(): LayerDelegate<IntersectionRealizationObservedSeismicSettings, SeismicPolylineAndFenceData> {
        return this._layerDelegate;
    }

    doSettingsChangesRequireDataRefetch(
        prevSettings: IntersectionRealizationObservedSeismicSettings,
        newSettings: IntersectionRealizationObservedSeismicSettings
    ): boolean {
        return !isEqual(prevSettings, newSettings);
    }

    makeBoundingBox(): BoundingBox | null {
        const data = this._layerDelegate.getData();
        if (!data) {
            return null;
        }

        // TODO: Implement bounding box calculation
        return null;
    }

    makeValueRange(): [number, number] | null {
        const data = this._layerDelegate.getData();
        if (!data) {
            return null;
        }

        // TODO: Implement value range calculation
        return null;
    }

    fetchData(queryClient: QueryClient): Promise<SeismicPolylineAndFenceData> {
        const settings = this.getSettingsContext().getDelegate().getSettings();
        const ensembleIdent = settings[SettingType.ENSEMBLE].getDelegate().getValue();
        const realization = settings[SettingType.REALIZATION].getDelegate().getValue();
        const intersection = settings[SettingType.INTERSECTION].getDelegate().getValue();
        const attribute = settings[SettingType.ATTRIBUTE].getDelegate().getValue();
        const timeOrInterval = settings[SettingType.TIME_OR_INTERVAL].getDelegate().getValue();
        const intersectionExtensionLength = settings[SettingType.INTERSECTION_EXTENSION_LENGTH]
            .getDelegate()
            .getValue();

        const queryKey = [
            "gridIntersection",
            ensembleIdent,
            realization,
            intersection,
            attribute,
            timeOrInterval,
            intersectionExtensionLength,
        ];
        this._layerDelegate.registerQueryKey(queryKey);

        // If no intersection is selected, return an empty polyline
        let makePolylineXyUtmPromise: Promise<number[]> = new Promise((resolve) => {
            resolve([]);
        });
        if (intersection) {
            makePolylineXyUtmPromise = makeIntersectionPolylineXyUtmPromiseForDelegate(
                intersection,
                this._itemDelegate,
                queryClient,
                intersectionExtensionLength ?? 0
            );
        }

        // TODO: Add control of resampling resolution?
        const resolution = 1;

        const seismicPolylineAndFenceDataPromise = makePolylineXyUtmPromise
            .then((polylineXyUtm) => createResampledPolylineXyUtm(polylineXyUtm, resolution))
            .then((resampledPolylineXyUtm) => createSeismicFencePolylineFromPolylineXy(resampledPolylineXyUtm))
            .then((seismicFencePolylineUtm) =>
                queryClient
                    .fetchQuery({
                        ...postGetSeismicFenceOptions({
                            query: {
                                case_uuid: ensembleIdent?.getCaseUuid() ?? "",
                                ensemble_name: ensembleIdent?.getEnsembleName() ?? "",
                                realization_num: realization ?? 0,
                                seismic_attribute: attribute ?? "",
                                time_or_interval_str: timeOrInterval ?? "",
                                observed: true, // Set true for observed seismic layer
                            },
                            body: {
                                polyline: seismicFencePolylineUtm,
                            },
                        }),
                    })
                    .then((apiData) => {
                        return createTransformedSeismicPolylineAndFenceData(seismicFencePolylineUtm, apiData);
                    })
            );

        return seismicPolylineAndFenceDataPromise;
    }

    serializeState(): SerializedLayer<IntersectionRealizationObservedSeismicSettings> {
        return this._layerDelegate.serializeState();
    }

    deserializeState(serializedState: SerializedLayer<IntersectionRealizationObservedSeismicSettings>): void {
        this._layerDelegate.deserializeState(serializedState);
    }
}

LayerRegistry.registerLayer(IntersectionRealizationObservedSeismicLayer);
