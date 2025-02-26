import React from "react";

import { IntersectionReferenceSystem } from "@equinor/esv-intersection";
import { ViewContext } from "@framework/ModuleContext";
import { useViewStatusWriter } from "@framework/StatusWriter";
import { WorkbenchServices } from "@framework/WorkbenchServices";
import { WorkbenchSession } from "@framework/WorkbenchSession";
import { WorkbenchSettings } from "@framework/WorkbenchSettings";
import { useElementSize } from "@lib/hooks/useElementSize";
import { ColorScale } from "@lib/utils/ColorScale";
import { makeIntersectionRealizationSeismicLayerItemOfType } from "@modules/IntersectionNew/LayerFramework/visualization/makeIntersectionSeismicLayer";
import { Interfaces } from "@modules/IntersectionNew/interfaces";
import { PreferredViewLayout } from "@modules/IntersectionNew/typesAndEnums";
import {
    IntersectionRealizationObservedSeismicLayer,
    IntersectionRealizationObservedSeismicSettings,
} from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationObservedSeismicLayer";
import {
    IntersectionRealizationSimulatedSeismicLayer,
    IntersectionRealizationSimulatedSeismicSettings,
} from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationSimulatedSeismicLayer";
import {
    LayerWithPosition,
    VisualizationFactory,
    VisualizationTarget,
} from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { ColorLegendsContainer } from "@modules/_shared/components/ColorLegendsContainer";
import { LayerItem } from "@modules/_shared/components/EsvIntersection";
import { SeismicLayer } from "@modules/_shared/components/EsvIntersection/layers/SeismicLayer";
import { ColorScaleWithName } from "@modules/_shared/utils/ColorScaleWithName";

import { ViewportWrapper } from "./viewportWrapper";

import { LayerManager } from "../../../_shared/LayerFramework/framework/LayerManager/LayerManager";

const VISUALIZATION_FACTORY = new VisualizationFactory<VisualizationTarget.ESV>();
VISUALIZATION_FACTORY.registerVisualizationFunction(
    IntersectionRealizationObservedSeismicLayer,
    makeIntersectionRealizationSeismicLayerItemOfType<IntersectionRealizationObservedSeismicSettings>
);
VISUALIZATION_FACTORY.registerVisualizationFunction(
    IntersectionRealizationSimulatedSeismicLayer,
    makeIntersectionRealizationSeismicLayerItemOfType<IntersectionRealizationSimulatedSeismicSettings>
);

export type LayersWrapperProps = {
    layerManager: LayerManager;
    preferredViewLayout: PreferredViewLayout;
    intersectionReferenceSystem: IntersectionReferenceSystem | null;
    wellboreHeaderUuid: string | null;
    viewContext: ViewContext<Interfaces>;
    workbenchSession: WorkbenchSession;
    workbenchSettings: WorkbenchSettings;
    workbenchServices: WorkbenchServices;
};

export function LayersWrapper(props: LayersWrapperProps): React.ReactNode {
    const mainDivRef = React.useRef<HTMLDivElement>(null);
    const mainDivSize = useElementSize(mainDivRef);
    const statusWriter = useViewStatusWriter(props.viewContext);

    const viewerLayers: LayerWithPosition<VisualizationTarget.ESV>[] = [];

    const viewsAndLayers = VISUALIZATION_FACTORY.make(props.layerManager);
    viewerLayers.push(...viewsAndLayers.layers);

    let numCols = Math.ceil(Math.sqrt(viewsAndLayers.views.length));
    let numRows = Math.ceil(viewsAndLayers.views.length / numCols);

    if (props.preferredViewLayout === PreferredViewLayout.HORIZONTAL) {
        [numCols, numRows] = [numRows, numCols];
    }
    // views.layout = [numCols, numRows];

    if (viewsAndLayers.numLoadingLayers > 0) {
        statusWriter.setLoading(true);
    }

    const tmp = viewsAndLayers.layers.at(0)?.dataLayer.settings;

    const visualizationLayers = viewerLayers
        .toSorted((a, b) => b.position - a.position)
        .map((layer) => layer.visualizationLayer);

    const colorScales: { id: string; colorScale: ColorScale }[] = [];
    for (const layerItem of layerItems) {
        if (!layerItemDataHasColorScale(layerItem)) {
            continue;
        }

        // TODO: Consider ColorScaleWithName?
        const colorScale = layerItem.options.data.colorScale;
        colorScales.push({ id: `${layerItem.id}-${colorScale.getColorPalette().getId()}`, colorScale });
    }

    const boundingBox = viewsAndLayers.boundingBox;
    // TODO: Project bounding box s.t. x is projected as u, and y will be the z-coordinate in intersection
    const bounds: { x: [number, number]; y: [number, number] } = boundingBox
        ? { x: boundingBox.x, y: boundingBox.z }
        : { x: [0, 0], y: [0, 0] };

    return (
        <div ref={mainDivRef} className="relative w-full h-full flex flex-col">
            <div style={{ height: mainDivSize.height, width: mainDivSize.width }}>
                <ViewportWrapper
                    referenceSystem={props.intersectionReferenceSystem ?? undefined}
                    layers={visualizationLayers}
                    // layerIdToNameMap={esvLayerIdToNameMap}
                    layerIdToNameMap={{}}
                    bounds={bounds}
                    viewport={viewport}
                    workbenchServices={props.workbenchServices}
                    viewContext={props.viewContext}
                    wellboreHeaderUuid={props.wellboreHeaderUuid}
                />
                <ColorLegendsContainer colorScales={colorScales} height={mainDivSize.height / 2 - 50} />
            </div>
        </div>
    );
}

function layerItemDataHasColorScale(
    layerItem: LayerItem
): layerItem is LayerItem & { options: { data: { colorScale: ColorScale } } } {
    return (
        layerItem.options &&
        layerItem.options.data &&
        (layerItem.options.data as any).colorScale &&
        (layerItem.options.data as any).colorScale instanceof ColorScale
    );
}
