import type { SurfaceIntersectionData_api } from "@api";
import {
    SurfaceAttributeType_api,
    getDrilledWellboreHeadersOptions,
    getRealizationSurfacesMetadataOptions,
    postGetSurfaceIntersectionOptions,
} from "@api";
import { IntersectionType } from "@framework/types/intersection";
import type { Vec2 } from "@lib/utils/vec2";
import { normalizeVec2, point2Distance } from "@lib/utils/vec2";
import type { PolylineWithSectionLengths } from "@modules/_shared/Intersection/intersectionPolylineTypes";
import type {
    PolylineIntersectionSpecification,
    WellboreIntersectionSpecification,
} from "@modules/_shared/Intersection/intersectionPolylineUtils";
import { makeIntersectionPolylineWithSectionLengthsPromise } from "@modules/_shared/Intersection/intersectionPolylineUtils";
import type {
    CustomDataLayerImplementation,
    DataLayerInformationAccessors,
    FetchDataParams,
} from "@modules/_shared/LayerFramework/interfacesAndTypes/customDataLayerImplementation";
import type { DefineDependenciesArgs } from "@modules/_shared/LayerFramework/interfacesAndTypes/customSettingsHandler";
import type { IntersectionSettingValue } from "@modules/_shared/LayerFramework/settings/implementations/IntersectionSetting";
import type { MakeSettingTypesMap } from "@modules/_shared/LayerFramework/settings/settingsDefinitions";
import { Setting } from "@modules/_shared/LayerFramework/settings/settingsDefinitions";

import { isEqual } from "lodash";

const intersectionSurfacesSettings = [
    Setting.INTERSECTION,
    Setting.INTERSECTION_EXTENSION_LENGTH,
    Setting.ENSEMBLE,
    Setting.REALIZATION,
    Setting.ATTRIBUTE,
    Setting.SURFACE_NAMES,
    Setting.SAMPLE_RESOLUTION_IN_METERS,
    Setting.COLOR_SET,
] as const;
export type IntersectionSurfacesSettings = typeof intersectionSurfacesSettings;
type SettingsWithTypes = MakeSettingTypesMap<IntersectionSurfacesSettings>;

export type IntersectionSurfacesStoredData = {
    polylineWithSectionLengths: PolylineWithSectionLengths;
};

export type IntersectionSurfacesData = SurfaceIntersectionData_api[];

export class IntersectionSurfacesLayer
    implements
        CustomDataLayerImplementation<
            IntersectionSurfacesSettings,
            IntersectionSurfacesData,
            IntersectionSurfacesStoredData
        >
{
    settings = intersectionSurfacesSettings;

    getDefaultName() {
        return "Intersection Surfaces";
    }

    doSettingsChangesRequireDataRefetch(prevSettings: SettingsWithTypes, newSettings: SettingsWithTypes): boolean {
        return !isEqual(prevSettings, newSettings);
    }

    areCurrentSettingsValid({
        getSetting,
    }: DataLayerInformationAccessors<
        IntersectionSurfacesSettings,
        IntersectionSurfacesData,
        IntersectionSurfacesStoredData
    >): boolean {
        // Extension has to be set if intersection is wellbore
        const isValidIntersectionExtensionLength =
            getSetting(Setting.INTERSECTION)?.type !== IntersectionType.WELLBORE ||
            getSetting(Setting.INTERSECTION_EXTENSION_LENGTH) !== null;

        return (
            getSetting(Setting.INTERSECTION) !== null &&
            isValidIntersectionExtensionLength &&
            getSetting(Setting.ENSEMBLE) !== null &&
            getSetting(Setting.REALIZATION) !== null &&
            getSetting(Setting.ATTRIBUTE) !== null &&
            getSetting(Setting.SURFACE_NAMES) !== null &&
            getSetting(Setting.SAMPLE_RESOLUTION_IN_METERS) !== null
        );
    }

    defineDependencies({
        helperDependency,
        availableSettingsUpdater,
        queryClient,
        workbenchSession,
        storedDataUpdater,
    }: DefineDependenciesArgs<IntersectionSurfacesSettings, IntersectionSurfacesStoredData>): void {
        availableSettingsUpdater(Setting.ENSEMBLE, ({ getGlobalSetting }) => {
            const fieldIdentifier = getGlobalSetting("fieldId");
            const ensembles = getGlobalSetting("ensembles");

            const ensembleIdentsForField = ensembles
                .filter((ensemble) => ensemble.getFieldIdentifier() === fieldIdentifier)
                .map((ensemble) => ensemble.getIdent());

            return ensembleIdentsForField;
        });

        availableSettingsUpdater(Setting.REALIZATION, ({ getLocalSetting, getGlobalSetting }) => {
            const ensembleIdent = getLocalSetting(Setting.ENSEMBLE);
            const realizationFilterFunc = getGlobalSetting("realizationFilterFunction");

            if (!ensembleIdent) {
                return [];
            }

            const realizations = realizationFilterFunc(ensembleIdent);
            return [...realizations];
        });

        const wellboreHeadersDep = helperDependency(async function fetchData({ getLocalSetting, abortSignal }) {
            const ensembleIdent = getLocalSetting(Setting.ENSEMBLE);

            if (!ensembleIdent) {
                return null;
            }

            const ensembleSet = workbenchSession.getEnsembleSet();
            const ensemble = ensembleSet.findEnsemble(ensembleIdent);

            if (!ensemble) {
                return null;
            }

            const fieldIdentifier = ensemble.getFieldIdentifier();

            return await queryClient.fetchQuery({
                ...getDrilledWellboreHeadersOptions({
                    query: { field_identifier: fieldIdentifier },
                    signal: abortSignal,
                }),
            });
        });

        availableSettingsUpdater(Setting.INTERSECTION, ({ getHelperDependency, getGlobalSetting }) => {
            const wellboreHeaders = getHelperDependency(wellboreHeadersDep);
            const intersectionPolylines = getGlobalSetting("intersectionPolylines");

            const intersectionOptions: IntersectionSettingValue[] = [];

            if (wellboreHeaders) {
                for (const wellboreHeader of wellboreHeaders) {
                    intersectionOptions.push({
                        type: IntersectionType.WELLBORE,
                        name: wellboreHeader.uniqueWellboreIdentifier,
                        uuid: wellboreHeader.wellboreUuid,
                    });
                }
            }

            for (const polyline of intersectionPolylines) {
                intersectionOptions.push({
                    type: IntersectionType.CUSTOM_POLYLINE,
                    name: polyline.name,
                    uuid: polyline.id,
                });
            }

            return intersectionOptions;
        });

        availableSettingsUpdater(Setting.INTERSECTION_EXTENSION_LENGTH, () => {
            const minExtensionLength = 0;
            const maxExtensionLength = 5000;
            return [minExtensionLength, maxExtensionLength];
        });

        const depthSurfaceMetadataDep = helperDependency(async ({ getLocalSetting, abortSignal }) => {
            const ensembleIdent = getLocalSetting(Setting.ENSEMBLE);

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
                (elm) => elm.attribute_type === SurfaceAttributeType_api.DEPTH,
            );
            return depthSurfacesMetadata;
        });

        availableSettingsUpdater(Setting.ATTRIBUTE, ({ getHelperDependency }) => {
            const depthSurfacesMetadata = getHelperDependency(depthSurfaceMetadataDep);

            if (!depthSurfacesMetadata) {
                return [];
            }

            return Array.from(new Set(depthSurfacesMetadata.map((elm) => elm.attribute_name)));
        });

        availableSettingsUpdater(Setting.SURFACE_NAMES, ({ getHelperDependency }) => {
            const depthSurfacesMetadata = getHelperDependency(depthSurfaceMetadataDep);

            if (!depthSurfacesMetadata) {
                return [];
            }

            return Array.from(new Set(depthSurfacesMetadata.map((elm) => elm.name)));
        });

        availableSettingsUpdater(Setting.SAMPLE_RESOLUTION_IN_METERS, () => {
            const minSampleResolution = 1;
            const maxSampleResolution = 100;
            return [minSampleResolution, maxSampleResolution];
        });

        // Create intersection polyline and actual section lengths data asynchronously
        const intersectionPolylineWithSectionLengthsDep = helperDependency(
            async ({ getLocalSetting, getGlobalSetting }) => {
                const fieldIdentifier = getGlobalSetting("fieldId");
                const intersection = getLocalSetting(Setting.INTERSECTION);
                const intersectionExtensionLength = getLocalSetting(Setting.INTERSECTION_EXTENSION_LENGTH) ?? 0;

                // If no intersection is selected, return an empty polyline
                if (!intersection) {
                    const emptyPolylineWithSectionLengthsPromise = new Promise<PolylineWithSectionLengths>((resolve) =>
                        resolve({
                            polylineUtmXy: [],
                            actualSectionLengths: [],
                        }),
                    );

                    return emptyPolylineWithSectionLengthsPromise;
                }

                if (intersection.type === IntersectionType.CUSTOM_POLYLINE) {
                    const polyline = workbenchSession
                        .getUserCreatedItems()
                        .getIntersectionPolylines()
                        .getPolyline(intersection.uuid);
                    if (!polyline) {
                        throw new Error(`Could not find polyline with id ${intersection.uuid}`);
                    }
                    const intersectionSpecification: PolylineIntersectionSpecification = {
                        type: IntersectionType.CUSTOM_POLYLINE,
                        polyline: polyline,
                    };
                    return makeIntersectionPolylineWithSectionLengthsPromise(intersectionSpecification);
                }
                if (intersection.type === IntersectionType.WELLBORE) {
                    if (!fieldIdentifier) {
                        throw new Error("Field identifier is not set");
                    }

                    const intersectionSpecification: WellboreIntersectionSpecification = {
                        type: IntersectionType.WELLBORE,
                        wellboreUuid: intersection.uuid,
                        intersectionExtensionLength: intersectionExtensionLength,
                        fieldIdentifier: fieldIdentifier,
                        queryClient,
                    };
                    return makeIntersectionPolylineWithSectionLengthsPromise(intersectionSpecification);
                }

                throw new Error(`Unhandled intersection type ${intersection.type}`);
            },
        );

        storedDataUpdater("polylineWithSectionLengths", ({ getHelperDependency }) => {
            const intersectionPolylineWithSectionLengths = getHelperDependency(
                intersectionPolylineWithSectionLengthsDep,
            );

            // If no intersection is selected, or polyline is empty, return an empty polyline
            if (
                !intersectionPolylineWithSectionLengths ||
                intersectionPolylineWithSectionLengths.polylineUtmXy.length === 0
            ) {
                return {
                    polylineUtmXy: [],
                    actualSectionLengths: [],
                };
            }

            return intersectionPolylineWithSectionLengths;
        });
    }

    fetchData({
        getSetting,
        getStoredData,
        registerQueryKey,
        queryClient,
    }: FetchDataParams<
        IntersectionSurfacesSettings,
        IntersectionSurfacesData,
        IntersectionSurfacesStoredData
    >): Promise<IntersectionSurfacesData> {
        const ensembleIdent = getSetting(Setting.ENSEMBLE);
        const realization = getSetting(Setting.REALIZATION);
        const attribute = getSetting(Setting.ATTRIBUTE);
        const surfaceNames = getSetting(Setting.SURFACE_NAMES);
        const sampleResolutionInMeters = getSetting(Setting.SAMPLE_RESOLUTION_IN_METERS) ?? 1;
        const intersectionExtensionLength = getSetting(Setting.INTERSECTION_EXTENSION_LENGTH) ?? 0;

        if (sampleResolutionInMeters === null || !surfaceNames || !attribute) {
            throw new Error("Invalid settings: Sample resolution, surface names or attribute are not set");
        }

        const polylineWithSectionLengths = getStoredData("polylineWithSectionLengths");
        if (!polylineWithSectionLengths) {
            throw new Error("No polyline and actual section lengths found in stored data");
        }
        if (polylineWithSectionLengths.polylineUtmXy.length < 4) {
            throw new Error("Invalid polyline in stored data. Must contain at least two (x,y)-points");
        }

        const queryKey = [
            "intersectionRealizationSurfaces",
            ensembleIdent,
            realization,
            attribute,
            surfaceNames,
            sampleResolutionInMeters,
            polylineWithSectionLengths.polylineUtmXy,
            polylineWithSectionLengths.actualSectionLengths,
        ];
        registerQueryKey(queryKey);

        const initialHorizontalPosition = -intersectionExtensionLength;
        const resampledIntersectionPolyline = createResampledPolylinePointsAndCumulatedLength(
            polylineWithSectionLengths.polylineUtmXy,
            polylineWithSectionLengths.actualSectionLengths,
            initialHorizontalPosition,
            sampleResolutionInMeters,
        );

        const surfacesIntersectionsPromises = Promise.all(
            surfaceNames.map((surfaceName) => {
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
                                x_points: resampledIntersectionPolyline.xPoints,
                                y_points: resampledIntersectionPolyline.yPoints,
                                cum_lengths: resampledIntersectionPolyline.cumulatedPolylineLengthArr,
                            },
                        },
                    }),
                });
            }),
        );

        return surfacesIntersectionsPromises;
    }
}

function createResampledPolylinePointsAndCumulatedLength(
    polylineUtmXy: number[],
    actualSectionLengths: number[],
    initialHorizontalPosition: number,
    sampledResolution: number,
): { xPoints: number[]; yPoints: number[]; cumulatedPolylineLengthArr: number[] } {
    const xPoints: number[] = [];
    const yPoints: number[] = [];
    let cumulatedPolylineLength = initialHorizontalPosition;
    const cumulatedPolylineLengthArr: number[] = [];
    for (let i = 0; i < polylineUtmXy.length; i += 2) {
        if (i > 0) {
            const distance = point2Distance(
                { x: polylineUtmXy[i], y: polylineUtmXy[i + 1] },
                { x: polylineUtmXy[i - 2], y: polylineUtmXy[i - 1] },
            );
            const actualDistance = actualSectionLengths[i / 2 - 1];
            const numPoints = Math.floor(distance / sampledResolution) - 1;
            const scale = actualDistance / distance;
            const scaledStepSize = sampledResolution * scale;

            const vector: Vec2 = {
                x: polylineUtmXy[i] - polylineUtmXy[i - 2],
                y: polylineUtmXy[i + 1] - polylineUtmXy[i - 1],
            };
            const normalizedVector = normalizeVec2(vector);
            for (let p = 1; p <= numPoints; p++) {
                xPoints.push(polylineUtmXy[i - 2] + normalizedVector.x * sampledResolution * p);
                yPoints.push(polylineUtmXy[i - 1] + normalizedVector.y * sampledResolution * p);
                cumulatedPolylineLength += scaledStepSize;
                cumulatedPolylineLengthArr.push(cumulatedPolylineLength);
            }
        }

        xPoints.push(polylineUtmXy[i]);
        yPoints.push(polylineUtmXy[i + 1]);

        if (i > 0) {
            const distance = point2Distance(
                { x: polylineUtmXy[i], y: polylineUtmXy[i + 1] },
                { x: xPoints[xPoints.length - 1], y: yPoints[yPoints.length - 1] },
            );

            cumulatedPolylineLength += distance;
        }

        cumulatedPolylineLengthArr.push(cumulatedPolylineLength);
    }

    return {
        xPoints,
        yPoints,
        cumulatedPolylineLengthArr,
    };
}
