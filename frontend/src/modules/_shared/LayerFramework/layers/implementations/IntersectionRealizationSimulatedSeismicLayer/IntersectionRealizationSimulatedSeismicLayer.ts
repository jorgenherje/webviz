import { postGetSeismicFenceOptions } from "@api";
import {
    createResampledPolylineXyUtm,
    makeIntersectionPolylinePromiseForDelegate,
} from "@modules/_shared/Intersection/intersectionPolylineUtils";
import {
    SeismicPolylineAndFenceData,
    createSeismicPolylineAndTransformedFenceData,
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

import { IntersectionRealizationSimulatedSeismicSettingsContext } from "./IntersectionRealizationSimulatedSeismicSettingsContext";
import { IntersectionRealizationSimulatedSeismicSettings } from "./types";

export class IntersectionRealizationSimulatedSeismicLayer
    implements Layer<IntersectionRealizationSimulatedSeismicSettings, SeismicPolylineAndFenceData>
{
    private _layerDelegate: LayerDelegate<IntersectionRealizationSimulatedSeismicSettings, SeismicPolylineAndFenceData>;
    private _itemDelegate: ItemDelegate;

    constructor(layerManager: LayerManager) {
        this._itemDelegate = new ItemDelegate("Intersection Realization Simulated Seismic", layerManager);
        this._layerDelegate = new LayerDelegate(
            this,
            layerManager,
            new IntersectionRealizationSimulatedSeismicSettingsContext(layerManager),
            LayerColoringType.COLORSCALE
        );
    }

    getSettingsContext() {
        return this._layerDelegate.getSettingsContext();
    }

    getItemDelegate(): ItemDelegate {
        return this._itemDelegate;
    }

    getLayerDelegate(): LayerDelegate<IntersectionRealizationSimulatedSeismicSettings, SeismicPolylineAndFenceData> {
        return this._layerDelegate;
    }

    doSettingsChangesRequireDataRefetch(
        prevSettings: IntersectionRealizationSimulatedSeismicSettings,
        newSettings: IntersectionRealizationSimulatedSeismicSettings
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
        const sampleResolution = settings[SettingType.SAMPLE_RESOLUTION_IN_METERS].getDelegate().getValue();

        const intersectionSelection = this._itemDelegate.getLayerManager().getGlobalSetting("intersectionSelection");

        // Fallback to 0 if intersectionExtensionLength is not set
        const intersectionExtensionLength =
            this._itemDelegate.getLayerManager().getGlobalSetting("intersectionExtensionLength") ?? 0;

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
        if (!intersectionSelection) {
            const emptySeismicPolylineAndFenceDataPromise = new Promise<SeismicPolylineAndFenceData>((resolve) =>
                resolve({
                    fenceData: {
                        fenceTracesFloat32Arr: new Float32Array(),
                        num_traces: 0,
                        num_samples_per_trace: 0,
                        min_fence_depth: 0,
                        max_fence_depth: 0,
                    },
                    fencePolylineUtmXy: [],
                    sourcePolyline: { polylineUtmXy: [], actualSectionLengths: [] },
                })
            );

            return emptySeismicPolylineAndFenceDataPromise;
        }

        // Make promise with valid polyline XY UTM coordinates
        // TODO: Early return if sourcePolylinePromise is empty array
        const sourcePolylinePromise = makeIntersectionPolylinePromiseForDelegate(
            intersectionSelection,
            this._itemDelegate,
            queryClient,
            intersectionExtensionLength
        );
        const resampledPolylineXyUtmPromise = sourcePolylinePromise.then((polyline) =>
            createResampledPolylineXyUtm(polyline.polylineUtmXy, sampleResolution ?? 1)
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
                            observed: false, // Set false for simulated seismic layer
                        },
                        body: {
                            polyline: seismicFencePolylineUtm,
                        },
                    }),
                })
            );

        const seismicPolylineAndFenceDataPromise = Promise.all([
            sourcePolylinePromise,
            resampledPolylineXyUtmPromise,
            seismicFenceApiDataPromise,
        ]).then(([sourcePolyline, resampledPolylineXyUtm, fenceApiData]) => {
            return createSeismicPolylineAndTransformedFenceData(sourcePolyline, resampledPolylineXyUtm, fenceApiData);
        });

        return seismicPolylineAndFenceDataPromise;
    }

    serializeState(): SerializedLayer<IntersectionRealizationSimulatedSeismicSettings> {
        return this._layerDelegate.serializeState();
    }

    deserializeState(serializedState: SerializedLayer<IntersectionRealizationSimulatedSeismicSettings>): void {
        this._layerDelegate.deserializeState(serializedState);
    }
}

LayerRegistry.registerLayer(IntersectionRealizationSimulatedSeismicLayer);
