import React from "react";

import type { IntersectionReferenceSystem } from "@equinor/esv-intersection";
import type { ViewContext } from "@framework/ModuleContext";
import { useViewStatusWriter } from "@framework/StatusWriter";
import type { WorkbenchServices } from "@framework/WorkbenchServices";
import type { WorkbenchSession } from "@framework/WorkbenchSession";
import type { WorkbenchSettings } from "@framework/WorkbenchSettings";
import { IntersectionType } from "@framework/types/intersection";
import type { Viewport } from "@framework/types/viewport";
import { PendingWrapper } from "@lib/components/PendingWrapper";
import { useElementSize } from "@lib/hooks/useElementSize";
import { makeColorScaleAnnotation } from "@modules/IntersectionNew/LayerFramework/annotations/makeColorScaleAnnotation";
import { makeIntersectionGridBoundingBox } from "@modules/IntersectionNew/LayerFramework/boundingBoxes/makeIntersectionGridBoundingBox";
import { makeIntersectionSeismicBoundingBox } from "@modules/IntersectionNew/LayerFramework/boundingBoxes/makeIntersectionSeismicBoundingBox";
import { makeIntersectionSurfacesBoundingBox } from "@modules/IntersectionNew/LayerFramework/boundingBoxes/makeIntersectionSurfacesBoundingBox";
import { EnsembleWellborePicksLayer } from "@modules/IntersectionNew/LayerFramework/customLayerImplementations/EnsembleWellborePicksLayer";
import { IntersectionSurfacesLayer } from "@modules/IntersectionNew/LayerFramework/customLayerImplementations/IntersectionSurfacesLayer";
import { CustomLayerType } from "@modules/IntersectionNew/LayerFramework/customLayerImplementations/layerTypes";
import type { IntersectionInjectedData } from "@modules/IntersectionNew/LayerFramework/injectedDataType";
import { makeEsvViewDataCollection } from "@modules/IntersectionNew/LayerFramework/visualization/makeEsvViewDataCollection";
import { createIntersectionRealizationGridLayerItemsMaker } from "@modules/IntersectionNew/LayerFramework/visualization/makeIntersectionGridLayer";
import { createIntersectionRealizationSeismicLayerItemsMaker } from "@modules/IntersectionNew/LayerFramework/visualization/makeIntersectionSeismicLayer";
import { createIntersectionSurfacesLayerItemsMaker } from "@modules/IntersectionNew/LayerFramework/visualization/makeIntersectionSurfacesLayer";
import { createWellborePicksLayerItemsMaker } from "@modules/IntersectionNew/LayerFramework/visualization/makeIntersectionWellborePicksLayer";
import type { Interfaces } from "@modules/IntersectionNew/interfaces";
import type { PreferredViewLayout } from "@modules/IntersectionNew/typesAndEnums";
import type { DataLayerManager } from "@modules/_shared/LayerFramework/framework/DataLayerManager/DataLayerManager";
import { LayerManagerTopic } from "@modules/_shared/LayerFramework/framework/DataLayerManager/DataLayerManager";
import { GroupType } from "@modules/_shared/LayerFramework/groups/groupTypes";
import { IntersectionView } from "@modules/_shared/LayerFramework/groups/implementations/IntersectionView";
import { IntersectionRealizationGridLayer } from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationGridLayer";
import { IntersectionRealizationSeismicLayer } from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationSeismicLayer";
import { LayerType } from "@modules/_shared/LayerFramework/layers/layerTypes";
import type {
    EsvLayerItemsMaker,
    VisualizationTarget,
} from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { VisualizationFactory } from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { useDrilledWellboreHeadersQuery } from "@modules/_shared/WellBore";
import { ColorLegendsContainer } from "@modules/_shared/components/ColorLegendsContainer";
import type { LayerItem } from "@modules/_shared/components/EsvIntersection";
import { usePublishSubscribeTopicValue } from "@modules/_shared/utils/PublishSubscribeDelegate";

import { isEqual } from "lodash";

import { ViewportWrapper } from "./viewportWrapper";

import "../../LayerFramework/customLayerImplementations/registerAllLayers";
import { useWellboreCasingsQuery } from "../hooks/queryHooks";
import { useCreateIntersectionReferenceSystem } from "../hooks/useIntersectionReferenceSystem";
import { createReferenceLinesLayerItem } from "../utils/createReferenceLines";
import { createWellboreLayerItems } from "../utils/createWellboreLayerItems";

export type DataLayersWrapperProps = {
    layerManager: DataLayerManager;
    preferredViewLayout: PreferredViewLayout;
    viewContext: ViewContext<Interfaces>;
    workbenchSession: WorkbenchSession;
    workbenchSettings: WorkbenchSettings;
    workbenchServices: WorkbenchServices;
};

const VISUALIZATION_FACTORY = new VisualizationFactory<VisualizationTarget.ESV, IntersectionInjectedData>();

VISUALIZATION_FACTORY.registerLayerFunctions(
    LayerType.INTERSECTION_REALIZATION_GRID,
    IntersectionRealizationGridLayer,
    {
        makeVisualizationFunction: createIntersectionRealizationGridLayerItemsMaker,
        calculateBoundingBoxFunction: makeIntersectionGridBoundingBox,
        makeAnnotationsFunction: makeColorScaleAnnotation,
    },
);
VISUALIZATION_FACTORY.registerLayerFunctions(
    LayerType.INTERSECTION_REALIZATION_SIMULATED_SEISMIC,
    IntersectionRealizationSeismicLayer,
    {
        makeVisualizationFunction: createIntersectionRealizationSeismicLayerItemsMaker,
        calculateBoundingBoxFunction: makeIntersectionSeismicBoundingBox,
        makeAnnotationsFunction: makeColorScaleAnnotation,
    },
);
VISUALIZATION_FACTORY.registerLayerFunctions(
    LayerType.INTERSECTION_REALIZATION_OBSERVED_SEISMIC,
    IntersectionRealizationSeismicLayer,
    {
        makeVisualizationFunction: createIntersectionRealizationSeismicLayerItemsMaker,
        calculateBoundingBoxFunction: makeIntersectionSeismicBoundingBox,
        makeAnnotationsFunction: makeColorScaleAnnotation,
    },
);
VISUALIZATION_FACTORY.registerLayerFunctions(CustomLayerType.ENSEMBLE_WELLBORE_PICKS, EnsembleWellborePicksLayer, {
    makeVisualizationFunction: createWellborePicksLayerItemsMaker,
});
VISUALIZATION_FACTORY.registerLayerFunctions(
    CustomLayerType.INTERSECTION_REALIZATION_SURFACES,
    IntersectionSurfacesLayer,
    {
        makeVisualizationFunction: createIntersectionSurfacesLayerItemsMaker,
        calculateBoundingBoxFunction: makeIntersectionSurfacesBoundingBox,
    },
);

VISUALIZATION_FACTORY.registerViewFunction(GroupType.INTERSECTION_VIEW, IntersectionView, makeEsvViewDataCollection);

export function DataLayersWrapper(props: DataLayersWrapperProps): React.ReactNode {
    const mainDivRef = React.useRef<HTMLDivElement>(null);
    const mainDivSize = useElementSize(mainDivRef);
    const statusWriter = useViewStatusWriter(props.viewContext);

    const [prevReferenceSystem, setPrevReferenceSystem] = React.useState<IntersectionReferenceSystem | null>(null);
    const [viewport, setViewport] = React.useState<Viewport>([0, 0, 2000]);
    const [prevLayersViewport, setPrevLayersViewport] = React.useState<Viewport | null>(null);
    const [prevBounds, setPrevBounds] = React.useState<{ x: [number, number]; y: [number, number] } | null>(null);
    const [isInitialLayerViewportSet, setIsInitialLayerViewportSet] = React.useState<boolean>(false);

    usePublishSubscribeTopicValue(props.layerManager, LayerManagerTopic.LAYER_DATA_REVISION);

    const fieldIdentifier: string | null = props.layerManager.getGlobalSetting("fieldId");

    // Build layers using factory
    const factoryProduct = VISUALIZATION_FACTORY.make(props.layerManager);

    // Create reference system for each view:
    if (factoryProduct.views.length === 0) {
        // return null;
        statusWriter.addWarning("Create intersection view to visualize layers");
    }

    if (factoryProduct.views.length > 1) {
        // throw new Error("Multiple views are not supported");
        statusWriter.addWarning("Multiple views are not supported");
    }

    // View of interest when supporting only one view
    const hasViews = factoryProduct.views.length > 0;
    const view = hasViews ? factoryProduct.views[0] : null;

    // Additional visualization for wellbore
    const wellboreHeadersQuery = useDrilledWellboreHeadersQuery(fieldIdentifier ?? undefined);
    const wellboreUuid = view?.intersection?.type === IntersectionType.WELLBORE ? view.intersection.uuid : null;
    const wellboreCasings = useWellboreCasingsQuery(wellboreUuid);

    const viewIntersection = view?.intersection ?? null;

    // Create intersection reference system for view
    const intersectionReferenceSystem: IntersectionReferenceSystem | null = useCreateIntersectionReferenceSystem(
        viewIntersection,
        fieldIdentifier,
        props.workbenchSession,
    );

    // Detect if intersection reference system has changed
    // let hasNewIntersectionReferenceSystem = false;
    // if (intersectionReferenceSystem && !isEqual(intersectionReferenceSystem, prevReferenceSystem)) {
    //     hasNewIntersectionReferenceSystem = true;
    //     setPrevReferenceSystem(intersectionReferenceSystem);
    //     setIsInitialLayerViewportSet(false);
    //     setPrevLayersViewport(null);
    // }

    // Extract layers from view of interest
    const factoryLayerMakers: EsvLayerItemsMaker[] = [];

    // Make layers using intersection reference system
    const factoryLayerItems: LayerItem[] = [];

    // Layers to be visualized in esv intersection
    const visualizationLayers: LayerItem[] = [];

    if (view && viewIntersection && intersectionReferenceSystem) {
        factoryLayerMakers.push(
            ...[...view.layers]
                .toSorted((a, b) => b.position - a.position)
                .map((layer) => layer.layer)
                .flat(),
        );

        for (const layerMaker of factoryLayerMakers) {
            factoryLayerItems.push(...layerMaker.makeLayerItems(intersectionReferenceSystem));
        }

        if (viewIntersection.type === IntersectionType.WELLBORE) {
            if (wellboreHeadersQuery.data && wellboreHeadersQuery.data.length > 0) {
                visualizationLayers.push(
                    createReferenceLinesLayerItem({
                        depthReferenceElevation: wellboreHeadersQuery.data[0].depthReferenceElevation,
                        depthReferencePoint: wellboreHeadersQuery.data[0].depthReferencePoint,
                    }),
                );
            }

            const layerOrder = factoryLayerItems.length + 1; // Place layers on top of factory layers
            const wellboreCasingsData =
                wellboreCasings.data && wellboreCasings.data.length > 0 ? wellboreCasings.data : null;
            visualizationLayers.push(
                ...createWellboreLayerItems(wellboreCasingsData, intersectionReferenceSystem, layerOrder),
            );
        }
    }

    // Append the factory layers to the visualization layers
    visualizationLayers.push(...factoryLayerItems);

    const layerIdToNameMap = Object.fromEntries(visualizationLayers.map((layer) => [layer.id, layer.name]));

    const isLoading = factoryProduct.numLoadingLayers > 0;
    statusWriter.setLoading(isLoading);

    const bounds: { x: [number, number]; y: [number, number] } = {
        x: [Number.MAX_VALUE, Number.MIN_VALUE],
        y: [Number.MAX_VALUE, Number.MIN_VALUE],
    };

    let isBoundsSetByLayer = false;
    if (factoryProduct.combinedBoundingBox) {
        const boundingBox = factoryProduct.combinedBoundingBox;
        bounds.x = [boundingBox.min.x, boundingBox.max.x];
        bounds.y = [boundingBox.min.y, boundingBox.max.y];
        isBoundsSetByLayer = true;
    }

    // Create viewport from intersectionReferenceSystem (i.e. the polyline)
    // - The intersection uz-coordinate system correspond to the esv intersection internal xy-coordinate system
    // if (intersectionReferenceSystem && hasNewIntersectionReferenceSystem) {
    if (!isBoundsSetByLayer && intersectionReferenceSystem) {
        const firstPoint = intersectionReferenceSystem.projectedPath[0];
        const numPoints = intersectionReferenceSystem.projectedPath.length;
        const lastPoint = intersectionReferenceSystem.projectedPath[numPoints - 1];
        const uMax = Math.max(firstPoint[0], lastPoint[0], 1000);
        const uMin = Math.min(firstPoint[0], lastPoint[0], -1000);
        const zMax = Math.max(firstPoint[1], lastPoint[1]);
        const zMin = Math.min(firstPoint[1], lastPoint[1]);

        // Set the (x,y)-bounds of esv intersection with uz-coordinates
        bounds.x = [uMin, uMax];
        bounds.y = [zMin, zMax];
    } else if (!isBoundsSetByLayer) {
        bounds.x = prevBounds?.x ?? [0, 2000];
        bounds.y = prevBounds?.y ?? [0, 2000];
    }

    if (!isEqual(bounds, prevBounds)) {
        setPrevBounds(bounds);
    }

    const viewportRatio = mainDivSize.width / mainDivSize.height;
    const safeViewportRatio = Number.isNaN(viewportRatio) ? 1 : viewportRatio;
    const newViewport: [number, number, number] = [
        bounds.x[0] + (bounds.x[1] - bounds.x[0]) / 2,
        bounds.y[0] + (bounds.y[1] - bounds.y[0]) / 2,
        Math.max(Math.abs(bounds.y[1] - bounds.y[0]) * safeViewportRatio, Math.abs(bounds.x[1] - bounds.x[0])) * 1.2,
    ];

    if (!isEqual(newViewport, prevLayersViewport) && !isInitialLayerViewportSet) {
        setViewport(newViewport);
        setPrevLayersViewport(newViewport);
        if (isBoundsSetByLayer) {
            setIsInitialLayerViewportSet(true);
        }
    }

    const isInvalidView = !view || !intersectionReferenceSystem || visualizationLayers.length === 0;

    return (
        <div ref={mainDivRef} className="relative w-full h-full flex flex-col">
            {isInvalidView ? null : (
                <PendingWrapper isPending={factoryProduct.numLoadingLayers > 0}>
                    <div style={{ height: mainDivSize.height, width: mainDivSize.width }}>
                        <ViewportWrapper
                            referenceSystem={intersectionReferenceSystem ?? undefined}
                            layers={visualizationLayers}
                            layerIdToNameMap={layerIdToNameMap}
                            bounds={bounds}
                            viewport={viewport}
                            workbenchServices={props.workbenchServices}
                            viewContext={props.viewContext}
                            wellboreHeaderUuid={wellboreHeadersQuery.data?.[0].wellboreUuid ?? null}
                        />
                        <ColorLegendsContainer
                            colorScales={factoryProduct.annotations}
                            height={mainDivSize.height / 2 - 50}
                        />
                    </div>
                </PendingWrapper>
            )}
        </div>
    );
}
