import { DataProviderRegistry } from "./DataProviderRegistry";
import { DataProviderType } from "./dataProviderTypes";
import { DrilledWellTrajectoriesProvider } from "./implementations/DrilledWellTrajectoriesProvider";
import { DrilledWellborePicksProvider } from "./implementations/DrilledWellborePicksProvider";
import {
    IntersectionRealizationSeismicProvider,
    SeismicDataSource,
} from "./implementations/IntersectionRealizationSeismicProvider";
import { IntersectionWithExtensionRealizationGridProvider } from "./implementations/IntersectionWithExtensionRealizationGridProvider";

DataProviderRegistry.registerDataProvider(DataProviderType.DRILLED_WELLBORE_PICKS, DrilledWellborePicksProvider);
DataProviderRegistry.registerDataProvider(DataProviderType.DRILLED_WELL_TRAJECTORIES, DrilledWellTrajectoriesProvider);
DataProviderRegistry.registerDataProvider(
    DataProviderType.INTERSECTION_REALIZATION_GRID,
    IntersectionWithExtensionRealizationGridProvider,
);
DataProviderRegistry.registerDataProvider(
    DataProviderType.INTERSECTION_REALIZATION_OBSERVED_SEISMIC,
    IntersectionRealizationSeismicProvider,
    [SeismicDataSource.OBSERVED],
);
DataProviderRegistry.registerDataProvider(
    DataProviderType.INTERSECTION_REALIZATION_SIMULATED_SEISMIC,
    IntersectionRealizationSeismicProvider,
    [SeismicDataSource.SIMULATED],
);
