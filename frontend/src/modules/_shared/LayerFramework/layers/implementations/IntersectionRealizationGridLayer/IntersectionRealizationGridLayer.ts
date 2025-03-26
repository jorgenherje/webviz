import { postGetPolylineIntersectionOptions } from "@api";
import {
    PolylineAndIntersectionData,
    createPolylineAndTransformedIntersectionData,
} from "@modules/_shared/Intersection/gridIntersectionTransform";
import { makeIntersectionPolylinePromiseForDelegate } from "@modules/_shared/Intersection/intersectionPolylineUtils";
import { ItemDelegate } from "@modules/_shared/LayerFramework/delegates/ItemDelegate";
import { LayerColoringType, LayerDelegate } from "@modules/_shared/LayerFramework/delegates/LayerDelegate";
import { LayerManager } from "@modules/_shared/LayerFramework/framework/LayerManager/LayerManager";
import { BoundingBox, Layer, SerializedLayer } from "@modules/_shared/LayerFramework/interfaces";
import { LayerRegistry } from "@modules/_shared/LayerFramework/layers/LayerRegistry";
import { SettingType } from "@modules/_shared/LayerFramework/settings/settingsTypes";
import { QueryClient } from "@tanstack/react-query";

import { isEqual } from "lodash";

import { IntersectionRealizationGridSettingsContext } from "./IntersectionRealizationGridSettingsContext";
import { IntersectionRealizationGridSettings } from "./types";

export class IntersectionRealizationGridLayer
    implements Layer<IntersectionRealizationGridSettings, PolylineAndIntersectionData>
{
    private _layerDelegate: LayerDelegate<IntersectionRealizationGridSettings, PolylineAndIntersectionData>;
    private _itemDelegate: ItemDelegate;

    constructor(layerManager: LayerManager) {
        this._itemDelegate = new ItemDelegate("Intersection Realization Grid", layerManager);
        this._layerDelegate = new LayerDelegate(
            this,
            layerManager,
            new IntersectionRealizationGridSettingsContext(layerManager),
            LayerColoringType.COLORSCALE
        );
    }

    getSettingsContext() {
        return this._layerDelegate.getSettingsContext();
    }

    getItemDelegate(): ItemDelegate {
        return this._itemDelegate;
    }

    getLayerDelegate(): LayerDelegate<IntersectionRealizationGridSettings, PolylineAndIntersectionData> {
        return this._layerDelegate;
    }

    doSettingsChangesRequireDataRefetch(
        prevSettings: IntersectionRealizationGridSettings,
        newSettings: IntersectionRealizationGridSettings
    ): boolean {
        return !isEqual(prevSettings, newSettings);
    }

    makeBoundingBox(): BoundingBox | null {
        const data = this._layerDelegate.getData();
        if (!data) {
            return null;
        }

        // TODO: Implement bounding box calculation
        if (data) {
            return null;
        }

        return null;
    }

    makeValueRange(): [number, number] | null {
        const data = this._layerDelegate.getData();
        if (!data) {
            return null;
        }

        if (data) {
            return [data.intersectionData.min_grid_prop_value, data.intersectionData.max_grid_prop_value];
        }

        return null;
    }

    fetchData(queryClient: QueryClient): Promise<PolylineAndIntersectionData> {
        const settings = this.getSettingsContext().getDelegate().getSettings();
        const ensembleIdent = settings[SettingType.ENSEMBLE].getDelegate().getValue();
        const realizationNum = settings[SettingType.REALIZATION].getDelegate().getValue();
        // const intersection = settings[SettingType.INTERSECTION].getDelegate().getValue();
        const gridName = settings[SettingType.GRID_NAME].getDelegate().getValue();
        const parameterName = settings[SettingType.ATTRIBUTE].getDelegate().getValue();
        let timeOrInterval = settings[SettingType.TIME_OR_INTERVAL].getDelegate().getValue();
        if (timeOrInterval === "NO_TIME") {
            timeOrInterval = null;
        }

        const intersectionSelection = this._itemDelegate.getLayerManager().getGlobalSetting("intersectionSelection");

        // Fallback to 0 if intersectionExtensionLength is not set
        const intersectionExtensionLength =
            this._itemDelegate.getLayerManager().getGlobalSetting("intersectionExtensionLength") ?? 0;

        const queryKey = [
            "gridIntersection",
            ensembleIdent,
            gridName,
            parameterName,
            timeOrInterval,
            realizationNum,
            intersectionSelection,
            intersectionExtensionLength,
        ];
        this._layerDelegate.registerQueryKey(queryKey);

        // If no intersection is selected, return an empty polyline
        if (!intersectionSelection) {
            const emptyPolylineAndIntersectionDataPromise = new Promise<PolylineAndIntersectionData>((resolve) =>
                resolve({
                    sourcePolyline: { polylineUtmXy: [], actualSectionLengths: [] },
                    intersectionData: {
                        fenceMeshSections: [],
                        grid_dimensions: { i_count: 0, j_count: 0, k_count: 0 },
                        max_grid_prop_value: 0,
                        min_grid_prop_value: 0,
                    },
                })
            );

            return emptyPolylineAndIntersectionDataPromise;
        }

        // TODO: Early return if sourcePolylinePromise is empty array
        const sourcePolylinePromise = makeIntersectionPolylinePromiseForDelegate(
            intersectionSelection,
            this._itemDelegate,
            queryClient,
            intersectionExtensionLength
        );

        const gridIntersectionApiDataPromise = sourcePolylinePromise.then((polyline) =>
            queryClient.fetchQuery({
                ...postGetPolylineIntersectionOptions({
                    query: {
                        case_uuid: ensembleIdent?.getCaseUuid() ?? "",
                        ensemble_name: ensembleIdent?.getEnsembleName() ?? "",
                        grid_name: gridName ?? "",
                        parameter_name: parameterName ?? "",
                        parameter_time_or_interval_str: timeOrInterval,
                        realization_num: realizationNum ?? 0,
                    },
                    body: { polyline_utm_xy: polyline.polylineUtmXy },
                }),
            })
        );

        const gridPolylineAndTransformedDataPromise = Promise.all([
            sourcePolylinePromise,
            gridIntersectionApiDataPromise,
        ]).then(([sourcePolyline, gridIntersectionApiData]) => {
            return createPolylineAndTransformedIntersectionData(sourcePolyline, gridIntersectionApiData);
        });

        return gridPolylineAndTransformedDataPromise;
    }

    serializeState(): SerializedLayer<IntersectionRealizationGridSettings> {
        return this._layerDelegate.serializeState();
    }

    deserializeState(serializedState: SerializedLayer<IntersectionRealizationGridSettings>): void {
        this._layerDelegate.deserializeState(serializedState);
    }
}

LayerRegistry.registerLayer(IntersectionRealizationGridLayer);
