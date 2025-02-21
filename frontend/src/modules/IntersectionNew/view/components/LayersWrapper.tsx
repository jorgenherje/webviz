import { LayerManager } from "@equinor/esv-intersection";
import { ViewContext } from "@framework/ModuleContext";
import { WorkbenchSession } from "@framework/WorkbenchSession";
import { WorkbenchSettings } from "@framework/WorkbenchSettings";
import { makeIntersectionRealizationSimulatedSeismicLayer } from "@modules/IntersectionNew/LayerFramework/visualization/makeIntersectionSeismicLayer";
import { Interfaces } from "@modules/IntersectionNew/interfaces";
import { PreferredViewLayout } from "@modules/IntersectionNew/typesAndEnums";
import { IntersectionRealizationObservedSeismicLayer } from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationObservedSeismicLayer/IntersectionRealizationObservedSeismicLayer";
import {
    VisualizationFactory,
    VisualizationTarget,
} from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";

const VISUALIZATION_FACTORY = new VisualizationFactory<VisualizationTarget.ESV>();
VISUALIZATION_FACTORY.registerVisualizationFunction(
    IntersectionRealizationObservedSeismicLayer,
    makeIntersectionRealizationSimulatedSeismicLayer
);

export type LayersWrapperProps = {
    layerManager: LayerManager;
    preferredViewLayout: PreferredViewLayout;
    viewContext: ViewContext<Interfaces>;
    workbenchSession: WorkbenchSession;
    workbenchSettings: WorkbenchSettings;
};

export function LayersWrapper(props: LayersWrapperProps): React.ReactNode {
    return <></>;
}
