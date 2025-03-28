import { LayerRegistry } from "./LayerRegistry";
import { DrilledWellTrajectoriesLayer } from "./implementations/DrilledWellTrajectoriesLayer";
import { DrilledWellborePicksLayer } from "./implementations/DrilledWellborePicksLayer";
import { IntersectionRealizationGridLayer } from "./implementations/IntersectionRealizationGridLayer";
import {
    IntersectionRealizationSeismicLayer,
    SeismicDataSource,
} from "./implementations/IntersectionRealizationSeismicLayer";
import { LayerType } from "./layerTypes";

LayerRegistry.registerLayer(LayerType.DRILLED_WELLBORE_PICKS, DrilledWellborePicksLayer);
LayerRegistry.registerLayer(LayerType.DRILLED_WELL_TRAJECTORIES, DrilledWellTrajectoriesLayer);
LayerRegistry.registerLayer(LayerType.INTERSECTION_REALIZATION_GRID, IntersectionRealizationGridLayer);
LayerRegistry.registerLayer(LayerType.INTERSECTION_REALIZATION_OBSERVED_SEISMIC, IntersectionRealizationSeismicLayer, [
    SeismicDataSource.OBSERVED,
]);
LayerRegistry.registerLayer(LayerType.INTERSECTION_REALIZATION_SIMULATED_SEISMIC, IntersectionRealizationSeismicLayer, [
    SeismicDataSource.SIMULATED,
]);
