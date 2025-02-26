import { postGetPolylineIntersectionOptions } from "@api";
import {
    PolylineIntersection_trans,
    transformPolylineIntersection,
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
    implements Layer<IntersectionRealizationGridSettings, PolylineIntersection_trans>
{
    private _layerDelegate: LayerDelegate<IntersectionRealizationGridSettings, PolylineIntersection_trans>;
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

    getLayerDelegate(): LayerDelegate<IntersectionRealizationGridSettings, PolylineIntersection_trans> {
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
            return [data.min_grid_prop_value, data.max_grid_prop_value];
        }

        return null;
    }

    fetchData(queryClient: QueryClient): Promise<PolylineIntersection_trans> {
        const settings = this.getSettingsContext().getDelegate().getSettings();
        const ensembleIdent = settings[SettingType.ENSEMBLE].getDelegate().getValue();
        const realizationNum = settings[SettingType.REALIZATION].getDelegate().getValue();
        const intersection = settings[SettingType.INTERSECTION].getDelegate().getValue();
        const gridName = settings[SettingType.GRID_NAME].getDelegate().getValue();
        const parameterName = settings[SettingType.ATTRIBUTE].getDelegate().getValue();
        let timeOrInterval = settings[SettingType.TIME_OR_INTERVAL].getDelegate().getValue();
        if (timeOrInterval === "NO_TIME") {
            timeOrInterval = null;
        }

        const queryKey = [
            "gridIntersection",
            ensembleIdent,
            gridName,
            parameterName,
            timeOrInterval,
            realizationNum,
            intersection,
        ];
        this._layerDelegate.registerQueryKey(queryKey);

        // If no intersection is selected, return an empty polyline
        const makePolylinePromise = intersection
            ? makeIntersectionPolylinePromiseForDelegate(intersection, this._itemDelegate, queryClient)
            : new Promise<{
                  polylineUtmXy: number[];
                  actualSectionLengths: number[];
              }>((resolve) => resolve({ polylineUtmXy: [], actualSectionLengths: [] }));

        const gridIntersectionPromise = makePolylinePromise
            .then((polyline) =>
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
            )
            .then(transformPolylineIntersection);

        return gridIntersectionPromise;
    }

    serializeState(): SerializedLayer<IntersectionRealizationGridSettings> {
        return this._layerDelegate.serializeState();
    }

    deserializeState(serializedState: SerializedLayer<IntersectionRealizationGridSettings>): void {
        this._layerDelegate.deserializeState(serializedState);
    }
}

LayerRegistry.registerLayer(IntersectionRealizationGridLayer);
