import { LayerRegistry } from "@modules/_shared/LayerFramework/layers/LayerRegistry";

import { EnsembleWellborePicksLayer } from "./EnsembleWellborePicksLayer";
import { IntersectionSurfacesLayer } from "./IntersectionSurfacesLayer";
import { CustomLayerType } from "./layerTypes";

LayerRegistry.registerLayer(CustomLayerType.ENSEMBLE_WELLBORE_PICKS, EnsembleWellborePicksLayer);
LayerRegistry.registerLayer(CustomLayerType.INTERSECTION_REALIZATION_SURFACES, IntersectionSurfacesLayer);
