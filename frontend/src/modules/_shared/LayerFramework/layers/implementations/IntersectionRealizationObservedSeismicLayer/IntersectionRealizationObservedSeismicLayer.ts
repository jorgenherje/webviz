import { postGetSeismicFenceOptions } from "@api";
import {
    createResampledPolylineXyUtm,
    makeIntersectionPolylinePromiseForDelegate,
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

        // TODO: Consider using source polyline, as it has samples?
        const xArray = data.fencePolylineUtmXy.filter((_, i) => i % 2 === 0);
        const yArray = data.fencePolylineUtmXy.filter((_, i) => i % 2 === 1);

        const [minX, maxX] = xArray.length === 0 ? [0, 0] : [Math.min(...xArray), Math.max(...xArray)];
        const [minY, maxY] = yArray.length === 0 ? [0, 0] : [Math.min(...yArray), Math.max(...yArray)];
        const [minZ, maxZ] = [data.fenceData.min_fence_depth, data.fenceData.max_fence_depth];

        return {
            x: [minX, maxX],
            y: [minY, maxY],
            z: [minZ, maxZ],
        };
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
        const attribute = settings[SettingType.ATTRIBUTE].getDelegate().getValue();
        const timeOrInterval = settings[SettingType.TIME_OR_INTERVAL].getDelegate().getValue();
        const intersectionExtensionLength = settings[SettingType.INTERSECTION_EXTENSION_LENGTH]
            .getDelegate()
            .getValue();

        const intersectionSelection = this._itemDelegate.getLayerManager().getGlobalSetting("intersectionSelection");

        const queryKey = [
            "gridIntersection",
            ensembleIdent,
            realization,
            intersectionSelection,
            attribute,
            timeOrInterval,
            intersectionExtensionLength,
        ];
        this._layerDelegate.registerQueryKey(queryKey);

        // If no intersection is selected, return an empty polyline
        const makePolylinePromise = intersectionSelection
            ? makeIntersectionPolylinePromiseForDelegate(
                  intersectionSelection,
                  this._itemDelegate,
                  queryClient,
                  intersectionExtensionLength ?? 0
              )
            : new Promise<{
                  polylineUtmXy: number[];
                  actualSectionLengths: number[];
              }>((resolve) => resolve({ polylineUtmXy: [], actualSectionLengths: [] }));

        // TODO: Add control of resampling resolution?
        const resolution = 1;

        const resampledPolylineXyUtmPromise = makePolylinePromise.then((polyline) =>
            createResampledPolylineXyUtm(polyline.polylineUtmXy, resolution)
        );
        const seismicFenceApiDataPromise = resampledPolylineXyUtmPromise
            .then((resampledPolylineXyUtm) => createSeismicFencePolylineFromPolylineXy(resampledPolylineXyUtm))
            .then((seismicFencePolylineUtm) =>
                queryClient.fetchQuery({
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
            );

        const seismicPolylineAndFenceDataPromise = Promise.all([
            makePolylinePromise,
            resampledPolylineXyUtmPromise,
            seismicFenceApiDataPromise,
        ]).then(([polyline, resampledPolylineXyUtm, apiData]) => {
            return createTransformedSeismicPolylineAndFenceData(polyline, resampledPolylineXyUtm, apiData);
        });

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
