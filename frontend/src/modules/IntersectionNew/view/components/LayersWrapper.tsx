import React from "react";

import { Layer } from "@equinor/esv-intersection";
import { ViewContext } from "@framework/ModuleContext";
import { useViewStatusWriter } from "@framework/StatusWriter";
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
    viewContext: ViewContext<Interfaces>;
    workbenchSession: WorkbenchSession;
    workbenchSettings: WorkbenchSettings;
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

    const layerItems = viewerLayers.toSorted((a, b) => b.position - a.position).map((layer) => layer.layer);

    const colorScales: { id: string; colorScale: ColorScale }[] = [];
    for (const layerItem of layerItems) {
        if (!layerItemDataHasColorScale(layerItem)) {
            continue;
        }

        // TODO: Consider ColorScaleWithName?
        const colorScale = layerItem.options.data.colorScale;
        colorScales.push({ id: `${layerItem.id}-${colorScale.getColorPalette().getId()}`, colorScale });
    }

    return (
        <div ref={mainDivRef} className="relative w-full h-full flex flex-col">
            <div style={{ height: mainDivSize.height, width: mainDivSize.width }}>
                <ViewportWrapper
                    referenceSystem={props.referenceSystem ?? undefined}
                    layers={layerItems}
                    layerIdToNameMap={esvLayerIdToNameMap}
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
