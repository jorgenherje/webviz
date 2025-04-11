import { DataProviderRegistry } from "@modules/_shared/DataProviderFramework/dataProviders/DataProviderRegistry";

import { EnsembleWellborePicksProvider } from "./EnsembleWellborePicksProvider";
import { PerRealizationSurfacesProvider } from "./PerRealizationSurfacesProvider";
import { RealizationSurfacesProvider } from "./RealizationSurfacesProvider";
import { CustomDataProviderType } from "./dataProviderTypes";

DataProviderRegistry.registerDataProvider(
    CustomDataProviderType.ENSEMBLE_WELLBORE_PICKS,
    EnsembleWellborePicksProvider,
);
DataProviderRegistry.registerDataProvider(CustomDataProviderType.REALIZATION_SURFACES, RealizationSurfacesProvider);
DataProviderRegistry.registerDataProvider(
    CustomDataProviderType.PER_REALIZATION_SURFACES,
    PerRealizationSurfacesProvider,
);
