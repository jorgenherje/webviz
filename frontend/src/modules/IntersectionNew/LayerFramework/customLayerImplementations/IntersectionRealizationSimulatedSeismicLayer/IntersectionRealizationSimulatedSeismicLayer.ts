import { postGetSeismicFenceOptions } from "@api";
import {
    createResampledSeismicFencePolyline,
    makeIntersectionPolylineXyUtmPromiseForDelegate,
} from "@modules/_shared/Intersection/intersectionPolylineUtils";
import {
    SeismicPolylineAndFenceData,
    createTransformedSeismicPolylineAndFenceData,
} from "@modules/_shared/Intersection/seismicIntersection";
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

        const queryKey = ["gridIntersection", ensembleIdent, realization, intersection, attribute, timeOrInterval];
        this._layerDelegate.registerQueryKey(queryKey);

        // If no intersection is selected, return an empty polyline
        let makePolylineXyUtmPromise: Promise<number[]> = new Promise((resolve) => {
            resolve([]);
        });
        if (intersection) {
            makePolylineXyUtmPromise = makeIntersectionPolylineXyUtmPromiseForDelegate(
                intersection,
                this._itemDelegate,
                queryClient
            );
        }

        // TODO: Add control of resampling resolution?
        const resolution = 1;

        const seismicPolylineAndFenceDataPromise = makePolylineXyUtmPromise
            .then((polylineXyUtm) => createResampledSeismicFencePolyline(polylineXyUtm, resolution))
            .then((requestedPolyline) =>
                queryClient
                    .fetchQuery({
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
                                polyline: requestedPolyline,
                            },
                        }),
                    })
                    .then((apiData) => {
                        return createTransformedSeismicPolylineAndFenceData(requestedPolyline, apiData);
                    })
            );

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
