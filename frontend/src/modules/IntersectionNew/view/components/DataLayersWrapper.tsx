import React from "react";

import { WellboreCasing_api } from "@api";
import { IntersectionReferenceSystem } from "@equinor/esv-intersection";
import { ViewContext } from "@framework/ModuleContext";
import { useViewStatusWriter } from "@framework/StatusWriter";
import { WorkbenchServices } from "@framework/WorkbenchServices";
import { WorkbenchSession } from "@framework/WorkbenchSession";
import { WorkbenchSettings } from "@framework/WorkbenchSettings";
import { IntersectionType } from "@framework/types/intersection";
import { Viewport } from "@framework/types/viewport";
import { useElementSize } from "@lib/hooks/useElementSize";
import { makeColorScaleAnnotation } from "@modules/IntersectionNew/LayerFramework/annotations/makeColorScaleAnnotation";
import { EnsembleWellborePicksLayer } from "@modules/IntersectionNew/LayerFramework/customLayerImplementations/EnsembleWellborePicksLayer";
import { IntersectionSurfacesLayer } from "@modules/IntersectionNew/LayerFramework/customLayerImplementations/IntersectionSurfacesLayer";
import { CustomLayerType } from "@modules/IntersectionNew/LayerFramework/customLayerImplementations/layerTypes";
import { makeIntersectionRealizationGridLayer } from "@modules/IntersectionNew/LayerFramework/visualization/makeIntersectionGridLayer";
import { makeIntersectionRealizationSeismicLayer } from "@modules/IntersectionNew/LayerFramework/visualization/makeIntersectionSeismicLayer";
import { makeIntersectionSurfacesLayer } from "@modules/IntersectionNew/LayerFramework/visualization/makeIntersectionSurfacesLayer";
import { makeWellborePicksLayer } from "@modules/IntersectionNew/LayerFramework/visualization/makeIntersectionWellborePicksLayer";
import { Interfaces } from "@modules/IntersectionNew/interfaces";
import { PreferredViewLayout, WellboreHeader } from "@modules/IntersectionNew/typesAndEnums";
import {
    DataLayerManager,
    LayerManagerTopic,
} from "@modules/_shared/LayerFramework/framework/DataLayerManager/DataLayerManager";
import { IntersectionRealizationGridLayer } from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationGridLayer";
import { IntersectionRealizationSeismicLayer } from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationSeismicLayer";
import { LayerType } from "@modules/_shared/LayerFramework/layers/layerTypes";
import {
    VisualizationFactory,
    VisualizationTarget,
} from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { ColorLegendsContainer } from "@modules/_shared/components/ColorLegendsContainer";
import { LayerItem } from "@modules/_shared/components/EsvIntersection";
import { usePublishSubscribeTopicValue } from "@modules/_shared/utils/PublishSubscribeDelegate";

import { isEqual } from "lodash";

import { ViewportWrapper } from "./viewportWrapper";

import { createReferenceLinesLayerItem } from "../utils/createReferenceLines";
import { createWellboreLayerItems } from "../utils/createWellboreLayerItems";

export type DataLayersWrapperProps = {
    layerManager: DataLayerManager;
    preferredViewLayout: PreferredViewLayout;
    // intersectionReferenceSystem: IntersectionReferenceSystem | null;
    // intersectionType: IntersectionType | null;
    // wellboreHeader: WellboreHeader | null;
    // wellboreCasingData: WellboreCasing_api[] | null;
    viewContext: ViewContext<Interfaces>;
    workbenchSession: WorkbenchSession;
    workbenchSettings: WorkbenchSettings;
    workbenchServices: WorkbenchServices;
};

const VISUALIZATION_FACTORY = new VisualizationFactory<VisualizationTarget.ESV>();

VISUALIZATION_FACTORY.registerLayerFunctions(
    LayerType.INTERSECTION_REALIZATION_GRID,
    IntersectionRealizationGridLayer,
    {
        makeVisualizationFunction: makeIntersectionRealizationGridLayer,
        calculateBoundingBoxFunction: undefined,
        makeAnnotationsFunction: makeColorScaleAnnotation,
    }
);
VISUALIZATION_FACTORY.registerLayerFunctions(
    LayerType.INTERSECTION_REALIZATION_SIMULATED_SEISMIC,
    IntersectionRealizationSeismicLayer,
    {
        makeVisualizationFunction: makeIntersectionRealizationSeismicLayer,
        calculateBoundingBoxFunction: undefined,
        makeAnnotationsFunction: makeColorScaleAnnotation,
    }
);
VISUALIZATION_FACTORY.registerLayerFunctions(
    LayerType.INTERSECTION_REALIZATION_OBSERVED_SEISMIC,
    IntersectionRealizationSeismicLayer,
    {
        makeVisualizationFunction: makeIntersectionRealizationSeismicLayer,
        calculateBoundingBoxFunction: undefined,
        makeAnnotationsFunction: makeColorScaleAnnotation,
    }
);
VISUALIZATION_FACTORY.registerLayerFunctions(CustomLayerType.ENSEMBLE_WELLBORE_PICKS, EnsembleWellborePicksLayer, {
    makeVisualizationFunction: makeWellborePicksLayer,
});
VISUALIZATION_FACTORY.registerLayerFunctions(
    CustomLayerType.INTERSECTION_REALIZATION_SURFACES,
    IntersectionSurfacesLayer,
    { makeVisualizationFunction: makeIntersectionSurfacesLayer }
);

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

    let hasNewIntersectionReferenceSystem = false;
    if (props.intersectionReferenceSystem && !isEqual(props.intersectionReferenceSystem, prevReferenceSystem)) {
        hasNewIntersectionReferenceSystem = true;
        setPrevReferenceSystem(props.intersectionReferenceSystem);
        setIsInitialLayerViewportSet(false);
        setPrevLayersViewport(null);
    }

    // Build layers using factory
    const factoryProduct = VISUALIZATION_FACTORY.make(props.layerManager);
    const factoryLayers: LayerItem[] = [...factoryProduct.layers]
        .toSorted((a, b) => b.position - a.position)
        .map((layer) => layer.layer)
        .flat();

    factoryProduct.views;

    // Layers to be visualized in esv intersection
    const visualizationLayers: LayerItem[] = [];

    // TODO: Retrieve wellbore header for respective view (from view intersection selection) // Create reference lines
    visualizationLayers.push(createReferenceLinesLayerItem(props.wellboreHeader));

    // Create wellbore layers
    if (props.intersectionType === IntersectionType.WELLBORE && props.intersectionReferenceSystem) {
        const layerOrder = factoryLayers.length + 1; // Place layers on top of factory layers
        visualizationLayers.push(
            ...createWellboreLayerItems(props.wellboreCasingData, props.intersectionReferenceSystem, layerOrder)
        );
    }

    factoryProduct.views[0].layers[0].layer[0]// Append the factory layers to the visualization layers
    .visualizationLayers
        .push(...factoryLayers);

    // TEMP!!
    for (const layer of visualizationLayers) {
        if (
            layer.name === "Ensemble Wellbore Picks" && //||
            // layer.name === "Surface Intersection" ||
            // layer.name === "Surface Intersection.labels"
            props.intersectionReferenceSystem
        ) {
            // Check if layer.options.data has referenceSystem key
            if (layer.options && layer.options.data && (layer.options.data as any).referenceSystem) {
                (layer.options.data as any).referenceSystem = props.intersectionReferenceSystem;
            }
        }
    }

    const layerIdToNameMap = Object.fromEntries(visualizationLayers.map((layer) => [layer.id, layer.name]));

    const isLoading = factoryProduct.numLoadingLayers > 0;
    statusWriter.setLoading(isLoading);

    const bounds: { x: [number, number]; y: [number, number] } = {
        x: [Number.MAX_VALUE, Number.MIN_VALUE],
        y: [Number.MAX_VALUE, Number.MIN_VALUE],
    };

    // Create viewport from intersectionReferenceSystem (i.e. the polyline)
    // - The intersection uz-coordinate system correspond to the esv intersection internal xy-coordinate system
    if (props.intersectionReferenceSystem && hasNewIntersectionReferenceSystem) {
        const firstPoint = props.intersectionReferenceSystem.projectedPath[0];
        const numPoints = props.intersectionReferenceSystem.projectedPath.length;
        const lastPoint = props.intersectionReferenceSystem.projectedPath[numPoints - 1];

        const uMax = Math.max(firstPoint[0], lastPoint[0], 1000);
        const uMin = Math.min(firstPoint[0], lastPoint[0], -1000);
        const zMax = Math.max(firstPoint[1], lastPoint[1]);
        const zMin = Math.min(firstPoint[1], lastPoint[1]);

        // Set the (x,y)-bounds of esv intersection with uz-coordinates
        bounds.x = [uMin, uMax];
        bounds.y = [zMin, zMax];
    } else {
        bounds.x = prevBounds?.x ?? [0, 2000];
        bounds.y = prevBounds?.y ?? [0, 2000];
    }

    // TODO:
    // Extract depth from bounding box
    // if (visualizationLayers.length > 0 && viewsAndLayers.boundingBox) {
    //     bounds.y = [viewsAndLayers.boundingBox.z[0], viewsAndLayers.boundingBox.z[1]];
    // }

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
        setIsInitialLayerViewportSet(true); // TODO: Should be set bounds by layer?
    }

    return (
        <div ref={mainDivRef} className="relative w-full h-full flex flex-col">
            <div style={{ height: mainDivSize.height, width: mainDivSize.width }}>
                <ViewportWrapper
                    referenceSystem={undefined} //{props.intersectionReferenceSystem ?? undefined}
                    layers={visualizationLayers}
                    layerIdToNameMap={layerIdToNameMap}
                    bounds={bounds}
                    viewport={viewport}
                    workbenchServices={props.workbenchServices}
                    viewContext={props.viewContext}
                    wellboreHeaderUuid={null} //{props.wellboreHeader?.uuid ?? null}
                />
                <ColorLegendsContainer colorScales={factoryProduct.annotations} height={mainDivSize.height / 2 - 50} />
            </div>
        </div>
    );
}
