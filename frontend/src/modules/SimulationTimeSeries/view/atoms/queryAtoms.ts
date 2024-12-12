import { Frequency_api, Observations_api } from "@api";
import { apiService } from "@framework/ApiService";
import { EnsembleIdent } from "@framework/EnsembleIdent";
import { ValidEnsembleRealizationsFunctionAtom } from "@framework/GlobalAtoms";
import { atomWithQueries } from "@framework/utils/atomUtils";
import { EnsembleVectorObservationDataMap, VisualizationMode } from "@modules/SimulationTimeSeries/typesAndEnums";
import { QueryObserverResult } from "@tanstack/react-query";

import {
    resampleFrequencyAtom,
    showObservationsAtom,
    vectorSpecificationsAtom,
    visualizationModeAtom,
} from "./baseAtoms";
import { regularEnsembleVectorSpecificationsAtom } from "./derivedAtoms";

const STALE_TIME = 60 * 1000;
const CACHE_TIME = 60 * 1000;

export const vectorDataQueriesAtom = atomWithQueries((get) => {
    const vectorSpecifications = get(vectorSpecificationsAtom);
    const resampleFrequency = get(resampleFrequencyAtom);
    const visualizationMode = get(visualizationModeAtom);
    const validEnsembleRealizationsFunction = get(ValidEnsembleRealizationsFunctionAtom);

    const enabled =
        visualizationMode === VisualizationMode.INDIVIDUAL_REALIZATIONS ||
        visualizationMode === VisualizationMode.STATISTICS_AND_REALIZATIONS;

    const queries = vectorSpecifications.map((item) => {
        // Regular Ensemble
        if (EnsembleIdent.isValidRegularEnsembleIdentString(item.ensembleIdent)) {
            const realizations = [...validEnsembleRealizationsFunction(item.ensembleIdent)];
            const { caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(
                item.ensembleIdent
            );

            return () => ({
                queryKey: [
                    "getRealizationsVectorData",
                    caseUuid,
                    ensembleName,
                    item.vectorName,
                    resampleFrequency,
                    realizations,
                ],
                queryFn: () =>
                    apiService.timeseries.getRealizationsVectorData(
                        caseUuid,
                        ensembleName,
                        item.vectorName ?? "",
                        resampleFrequency,
                        realizations
                    ),
                staleTime: STALE_TIME,
                gcTime: CACHE_TIME,
                enabled: !!(enabled && item.vectorName && caseUuid && ensembleName),
            });
        }

        // Delta Ensemble
        if (!EnsembleIdent.isValidDeltaEnsembleIdentString(item.ensembleIdent)) {
            throw new Error(`Invalid delta ensemble ident string: ${item.ensembleIdent}`);
        }
        const realizations = [...validEnsembleRealizationsFunction(item.ensembleIdent)];
        const { compareEnsemble, referenceEnsemble } = EnsembleIdent.deltaEnsembleCaseUuidsAndNamesFromString(
            item.ensembleIdent
        );

        return () => ({
            queryKey: [
                "getDeltaEnsembleRealizationsVectorData",
                compareEnsemble.caseUuid,
                compareEnsemble.ensembleName,
                referenceEnsemble.caseUuid,
                referenceEnsemble.ensembleName,
                item.vectorName,
                resampleFrequency,
                realizations,
            ],
            queryFn: () =>
                apiService.timeseries.getDeltaEnsembleRealizationsVectorData(
                    compareEnsemble.caseUuid,
                    compareEnsemble.ensembleName,
                    referenceEnsemble.caseUuid,
                    referenceEnsemble.ensembleName,
                    item.vectorName ?? "",
                    resampleFrequency ?? Frequency_api.YEARLY,
                    realizations
                ),
            staleTime: STALE_TIME,
            gcTime: CACHE_TIME,
            enabled: !!(
                enabled &&
                resampleFrequency &&
                item.vectorName &&
                compareEnsemble.caseUuid &&
                compareEnsemble.ensembleName &&
                referenceEnsemble.caseUuid &&
                referenceEnsemble.ensembleName
            ),
        });
    });

    return {
        queries,
    };
});

export const vectorStatisticsQueriesAtom = atomWithQueries((get) => {
    const vectorSpecifications = get(vectorSpecificationsAtom);
    const resampleFrequency = get(resampleFrequencyAtom);
    const visualizationMode = get(visualizationModeAtom);
    const validEnsembleRealizationsFunction = get(ValidEnsembleRealizationsFunctionAtom);

    const enabled =
        visualizationMode === VisualizationMode.STATISTICAL_FANCHART ||
        visualizationMode === VisualizationMode.STATISTICAL_LINES ||
        visualizationMode === VisualizationMode.STATISTICS_AND_REALIZATIONS;

    const queries = vectorSpecifications.map((item) => {
        // Regular Ensemble
        if (EnsembleIdent.isValidRegularEnsembleIdentString(item.ensembleIdent)) {
            const realizations = [...validEnsembleRealizationsFunction(item.ensembleIdent)];
            const { caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(
                item.ensembleIdent
            );

            return () => ({
                queryKey: [
                    "getStatisticalVectorData",
                    caseUuid,
                    ensembleName,
                    item.vectorName,
                    resampleFrequency,
                    realizations,
                ],
                queryFn: () =>
                    apiService.timeseries.getStatisticalVectorData(
                        caseUuid,
                        ensembleName,
                        item.vectorName ?? "",
                        resampleFrequency ?? Frequency_api.MONTHLY,
                        undefined,
                        realizations
                    ),
                staleTime: STALE_TIME,
                gcTime: CACHE_TIME,
                enabled: !!(enabled && item.vectorName && caseUuid && ensembleName),
            });
        }

        // Delta Ensemble
        if (!EnsembleIdent.isValidDeltaEnsembleIdentString(item.ensembleIdent)) {
            throw new Error(`Invalid delta ensemble ident string: ${item.ensembleIdent}`);
        }
        const realizations = [...validEnsembleRealizationsFunction(item.ensembleIdent)];
        const { compareEnsemble, referenceEnsemble } = EnsembleIdent.deltaEnsembleCaseUuidsAndNamesFromString(
            item.ensembleIdent
        );

        return () => ({
            queryKey: [
                "getDeltaEnsembleStatisticalVectorData",
                compareEnsemble.caseUuid,
                compareEnsemble.ensembleName,
                referenceEnsemble.caseUuid,
                referenceEnsemble.ensembleName,
                item.vectorName,
                resampleFrequency,
                realizations,
            ],
            queryFn: () =>
                apiService.timeseries.getDeltaEnsembleStatisticalVectorData(
                    compareEnsemble.caseUuid,
                    compareEnsemble.ensembleName,
                    referenceEnsemble.caseUuid,
                    referenceEnsemble.ensembleName,
                    item.vectorName,
                    resampleFrequency ?? Frequency_api.MONTHLY,
                    undefined,
                    realizations
                ),
            staleTime: STALE_TIME,
            gcTime: CACHE_TIME,
            enabled: !!(
                enabled &&
                resampleFrequency &&
                item.vectorName &&
                compareEnsemble.caseUuid &&
                compareEnsemble.ensembleName &&
                referenceEnsemble.caseUuid &&
                referenceEnsemble.ensembleName
            ),
        });
    });

    return {
        queries,
    };
});

export const regularEnsembleHistoricalVectorDataQueriesAtom = atomWithQueries((get) => {
    const resampleFrequency = get(resampleFrequencyAtom);
    const regularEnsembleVectorSpecifications = get(regularEnsembleVectorSpecificationsAtom);

    const enabled = regularEnsembleVectorSpecifications.some((elm) => elm.hasHistoricalVector);

    const queries = regularEnsembleVectorSpecifications.map((item) => {
        const { caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(item.ensembleIdent);

        return () => ({
            queryKey: ["getHistoricalVectorData", caseUuid, ensembleName, item.vectorName, resampleFrequency],
            queryFn: () =>
                apiService.timeseries.getHistoricalVectorData(
                    caseUuid,
                    ensembleName,
                    item.vectorName,
                    resampleFrequency ?? Frequency_api.MONTHLY
                ),
            staleTime: STALE_TIME,
            gcTime: CACHE_TIME,
            enabled: !!(enabled && item.vectorName && caseUuid && ensembleName),
        });
    });

    return {
        queries,
    };
});

export const vectorObservationsQueriesAtom = atomWithQueries((get) => {
    const showObservations = get(showObservationsAtom);
    const vectorSpecifications = get(vectorSpecificationsAtom);

    // Only regular ensemble idents (how to "see" this around in the module?)
    const uniqueRegularEnsembleIdents: { ident: string; caseUuid: string }[] = [
        ...new Set(
            vectorSpecifications
                ?.filter((item) => EnsembleIdent.isValidRegularEnsembleIdentString(item.ensembleIdent))
                .map((item) => {
                    return {
                        ident: item.ensembleIdent,
                        caseUuid: EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(item.ensembleIdent).caseUuid,
                    };
                }) ?? []
        ),
    ];

    const queries = uniqueRegularEnsembleIdents.map((item) => {
        return () => ({
            queryKey: ["getObservations", item.caseUuid],
            queryFn: () => apiService.observations.getObservations(item.caseUuid ?? ""),
            staleTime: STALE_TIME,
            gcTime: CACHE_TIME,
            enabled: !!(showObservations && item.caseUuid),
        });
    });

    return {
        queries,
        combine: (results: QueryObserverResult<Observations_api>[]) => {
            const combinedResult: EnsembleVectorObservationDataMap = new Map();
            if (!vectorSpecifications) {
                return { isFetching: false, isError: false, ensembleVectorObservationDataMap: combinedResult };
            }

            results.forEach((result, index) => {
                const ensembleIdent = uniqueRegularEnsembleIdents.at(index)?.ident;
                if (!ensembleIdent) return;

                const ensembleVectorSpecifications = vectorSpecifications.filter(
                    (item) => item.ensembleIdent === ensembleIdent
                );

                const ensembleHasObservations = result.data?.summary.length !== 0;
                combinedResult.set(ensembleIdent, {
                    hasSummaryObservations: ensembleHasObservations,
                    vectorsObservationData: [],
                });
                for (const vectorSpec of ensembleVectorSpecifications) {
                    const vectorObservationsData =
                        result.data?.summary.find((elm) => elm.vector_name === vectorSpec.vectorName) ?? null;
                    if (!vectorObservationsData) continue;

                    combinedResult.get(ensembleIdent)?.vectorsObservationData.push({
                        vectorSpecification: vectorSpec,
                        data: vectorObservationsData,
                    });
                }
            });

            return {
                isFetching: results.some((result) => result.isFetching),
                isError: results.some((result) => result.isError),
                ensembleVectorObservationDataMap: combinedResult,
            };
        },
    };
});
