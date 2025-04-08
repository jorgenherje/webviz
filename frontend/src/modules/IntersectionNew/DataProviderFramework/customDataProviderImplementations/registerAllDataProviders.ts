import { DataProviderRegistry } from "@modules/_shared/DataProviderFramework/dataProviders/DataProviderRegistry";

import { EnsembleWellborePicksProvider } from "./EnsembleWellborePicksProvider";
import { IntersectionSurfacesProvider } from "./IntersectionSurfacesProvider";
import { CustomDataProviderType } from "./dataProviderTypes";

DataProviderRegistry.registerDataProvider(
    CustomDataProviderType.ENSEMBLE_WELLBORE_PICKS,
    EnsembleWellborePicksProvider,
);
DataProviderRegistry.registerDataProvider(
    CustomDataProviderType.INTERSECTION_REALIZATION_SURFACES,
    IntersectionSurfacesProvider,
);
