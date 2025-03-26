import { SurfaceIntersectionData_api, postGetSurfaceIntersectionOptions } from "@api";
import { Vec2, normalizeVec2, point2Distance } from "@lib/utils/vec2";
import { makeIntersectionPolylinePromiseForDelegate } from "@modules/_shared/Intersection/intersectionPolylineUtils";
import { ItemDelegate } from "@modules/_shared/LayerFramework/delegates/ItemDelegate";
import { LayerColoringType, LayerDelegate } from "@modules/_shared/LayerFramework/delegates/LayerDelegate";
import { LayerManager } from "@modules/_shared/LayerFramework/framework/LayerManager/LayerManager";
import { BoundingBox, Layer, SerializedLayer } from "@modules/_shared/LayerFramework/interfaces";
import { LayerRegistry } from "@modules/_shared/LayerFramework/layers/LayerRegistry";
import { SettingType } from "@modules/_shared/LayerFramework/settings/settingsTypes";
import { QueryClient } from "@tanstack/query-core";

import { isEqual } from "lodash";

import { IntersectionSurfaceSettingsContext } from "./IntersectionSurfaceSettingsContext";
import { IntersectionSurfaceSettings } from "./types";

export class IntersectionSurfaceLayer implements Layer<IntersectionSurfaceSettings, SurfaceIntersectionData_api[]> {
    private _layerDelegate: LayerDelegate<IntersectionSurfaceSettings, SurfaceIntersectionData_api[]>;
    private _itemDelegate: ItemDelegate;

    constructor(layerManager: LayerManager) {
        this._itemDelegate = new ItemDelegate("Surface Intersection", layerManager);
        this._layerDelegate = new LayerDelegate(
            this,
            layerManager,
            new IntersectionSurfaceSettingsContext(layerManager),
            LayerColoringType.COLORSET
        );
    }

    getSettingsContext() {
        return this._layerDelegate.getSettingsContext();
    }

    getItemDelegate(): ItemDelegate {
        return this._itemDelegate;
    }

    getLayerDelegate(): LayerDelegate<IntersectionSurfaceSettings, SurfaceIntersectionData_api[]> {
        return this._layerDelegate;
    }

    doSettingsChangesRequireDataRefetch(
        prevSettings: IntersectionSurfaceSettings,
        newSettings: IntersectionSurfaceSettings
    ): boolean {
        return !isEqual(prevSettings, newSettings);
    }

    makeBoundingBox(): BoundingBox | null {
        const data = this._layerDelegate.getData();
        if (!data) {
            return null;
        }
        return null;
    }

    fetchData(queryClient: QueryClient): Promise<SurfaceIntersectionData_api[]> {
        const settings = this.getSettingsContext().getDelegate().getSettings();
        const ensembleIdent = settings[SettingType.ENSEMBLE].getDelegate().getValue();
        const realization = settings[SettingType.REALIZATION].getDelegate().getValue();
        const attribute = settings[SettingType.ATTRIBUTE].getDelegate().getValue();
        // const surfaceNames = settings[SettingType.SURFACE_NAMES].getDelegate().getValue();
        const surfaceName = settings[SettingType.SURFACE_NAME].getDelegate().getValue();
        const sampleResolution = settings[SettingType.SAMPLE_RESOLUTION_IN_METERS].getDelegate().getValue();

        const intersectionSelection = this._itemDelegate.getLayerManager().getGlobalSetting("intersectionSelection");

        // Fallback to 0 if intersectionExtensionLength is not set
        const intersectionExtensionLength =
            this._itemDelegate.getLayerManager().getGlobalSetting("intersectionExtensionLength") ?? 0;

        // if (!intersectionSelection || sampleResolution === null || !surfaceNames || !attribute) {
        if (!intersectionSelection || sampleResolution === null || !surfaceName || !attribute) {
            const emptyResultPromise = new Promise<SurfaceIntersectionData_api[]>((resolve) => {
                resolve([]);
            });

            return emptyResultPromise;
        }

        // TODO: Early return if sourcePolylinePromise is empty array
        const sourcePolylinePromise = makeIntersectionPolylinePromiseForDelegate(
            intersectionSelection,
            this._itemDelegate,
            queryClient,
            intersectionExtensionLength
        );

        const resampledIntersectionPolylinePromise = sourcePolylinePromise.then((sourcePolyline) => {
            const polylineUtmXy = sourcePolyline.polylineUtmXy;

            const xPoints: number[] = [];
            const yPoints: number[] = [];
            let cumulatedHorizontalPolylineLength = -intersectionExtensionLength;
            const cumulatedHorizontalPolylineLengthArr: number[] = [];
            for (let i = 0; i < polylineUtmXy.length; i += 2) {
                if (i > 0) {
                    const distance = point2Distance(
                        { x: polylineUtmXy[i], y: polylineUtmXy[i + 1] },
                        { x: polylineUtmXy[i - 2], y: polylineUtmXy[i - 1] }
                    );
                    const actualDistance = sourcePolyline.actualSectionLengths[i / 2 - 1];
                    const numPoints = Math.floor(distance / sampleResolution) - 1;
                    const scale = actualDistance / distance;
                    const scaledStepSize = sampleResolution * scale;

                    const vector: Vec2 = {
                        x: polylineUtmXy[i] - polylineUtmXy[i - 2],
                        y: polylineUtmXy[i + 1] - polylineUtmXy[i - 1],
                    };
                    const normalizedVector = normalizeVec2(vector);
                    for (let p = 1; p <= numPoints; p++) {
                        xPoints.push(polylineUtmXy[i - 2] + normalizedVector.x * sampleResolution * p);
                        yPoints.push(polylineUtmXy[i - 1] + normalizedVector.y * sampleResolution * p);
                        cumulatedHorizontalPolylineLength += scaledStepSize;
                        cumulatedHorizontalPolylineLengthArr.push(cumulatedHorizontalPolylineLength);
                    }
                }

                xPoints.push(polylineUtmXy[i]);
                yPoints.push(polylineUtmXy[i + 1]);

                if (i > 0) {
                    const distance = point2Distance(
                        { x: polylineUtmXy[i], y: polylineUtmXy[i + 1] },
                        { x: xPoints[xPoints.length - 1], y: yPoints[yPoints.length - 1] }
                    );

                    cumulatedHorizontalPolylineLength += distance;
                }

                cumulatedHorizontalPolylineLengthArr.push(cumulatedHorizontalPolylineLength);
            }

            return {
                xPoints,
                yPoints,
                cumulatedHorizontalPolylineLengthArr,
            };
        });

        const surfacesIntersectionsPromises = resampledIntersectionPolylinePromise.then((resampledPolyline) => {
            return Promise.all(
                // surfaceNames.map((surfaceName) => {
                [surfaceName].map((surfaceName) => {
                    return queryClient.fetchQuery({
                        ...postGetSurfaceIntersectionOptions({
                            query: {
                                case_uuid: ensembleIdent?.getCaseUuid() ?? "",
                                ensemble_name: ensembleIdent?.getEnsembleName() ?? "",
                                realization_num: realization ?? 0,
                                name: surfaceName,
                                attribute: attribute ?? "",
                            },
                            body: {
                                cumulative_length_polyline: {
                                    x_points: resampledPolyline.xPoints,
                                    y_points: resampledPolyline.yPoints,
                                    cum_lengths: resampledPolyline.cumulatedHorizontalPolylineLengthArr,
                                },
                            },
                        }),
                    });
                })
            );
        });

        return surfacesIntersectionsPromises;
    }

    serializeState(): SerializedLayer<IntersectionSurfaceSettings> {
        return this._layerDelegate.serializeState();
    }

    deserializeState(serializedState: SerializedLayer<IntersectionSurfaceSettings>): void {
        this._layerDelegate.deserializeState(serializedState);
    }
}

LayerRegistry.registerLayer(IntersectionSurfaceLayer);
