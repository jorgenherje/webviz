import React from "react";

import { useAtomValue } from "jotai";

import { useWebWorkerProxy } from "@lib/hooks/useWebWorker";
import { createZipFilename, downloadZip } from "@lib/utils/downloadUtils";
import { makeDistinguishableEnsembleDisplayName } from "@modules/_shared/ensembleNameUtils";

import {
    csvDownloadRequestCounterAtom,
    showHistoricalAtom,
    showObservationsAtom,
    statisticsSelectionAtom,
    visualizationModeAtom,
} from "../../settings/atoms/baseAtoms";
import { selectedDeltaEnsemblesAtom, selectedRegularEnsemblesAtom } from "../../settings/atoms/derivedAtoms";
import {
    loadedRegularEnsembleVectorSpecificationsAndHistoricalDataAtom,
    loadedVectorSpecificationsAndObservationDataAtom,
    loadedVectorSpecificationsAndRealizationDataAtom,
    loadedVectorSpecificationsAndStatisticsDataAtom,
} from "../atoms/derivedAtoms";
import type { CsvAssemblyWorkerApi } from "../utils/CsvAssembly/csvAssembly";
import CsvAssemblyWorker from "../utils/CsvAssembly/csvAssembly?worker";

export function useDownloadData(): void {
    const csvDownloadRequestCounter = useAtomValue(csvDownloadRequestCounterAtom);
    const prevCounterRef = React.useRef(csvDownloadRequestCounter);

    const visualizationMode = useAtomValue(visualizationModeAtom);
    const statisticsSelection = useAtomValue(statisticsSelectionAtom);
    const showHistorical = useAtomValue(showHistoricalAtom);
    const showObservations = useAtomValue(showObservationsAtom);

    const selectedRegularEnsembles = useAtomValue(selectedRegularEnsemblesAtom);
    const selectedDeltaEnsembles = useAtomValue(selectedDeltaEnsemblesAtom);

    const loadedRealizationData = useAtomValue(loadedVectorSpecificationsAndRealizationDataAtom);
    const loadedStatisticsData = useAtomValue(loadedVectorSpecificationsAndStatisticsDataAtom);
    const loadedHistoricalData = useAtomValue(loadedRegularEnsembleVectorSpecificationsAndHistoricalDataAtom);
    const loadedObservationData = useAtomValue(loadedVectorSpecificationsAndObservationDataAtom);

    const csvAssemblyWorker = useWebWorkerProxy<CsvAssemblyWorkerApi>(CsvAssemblyWorker);

    React.useEffect(
        function assembleCsvAndDownload() {
            if (csvDownloadRequestCounter === prevCounterRef.current) {
                return;
            }
            prevCounterRef.current = csvDownloadRequestCounter;

            let cancelled = false;

            async function run() {
                try {
                    const startTime = performance.now();

                    const allSelectedEnsembles = [...selectedRegularEnsembles, ...selectedDeltaEnsembles];

                    const realizationData = loadedRealizationData.map((entry) => ({
                        ensembleDisplayName: makeDistinguishableEnsembleDisplayName(
                            entry.vectorSpecification.ensembleIdent,
                            allSelectedEnsembles,
                        ),
                        vectorName: entry.vectorSpecification.vectorName,
                        data: entry.data,
                    }));

                    const statisticsData = loadedStatisticsData.map((entry) => ({
                        ensembleDisplayName: makeDistinguishableEnsembleDisplayName(
                            entry.vectorSpecification.ensembleIdent,
                            allSelectedEnsembles,
                        ),
                        vectorName: entry.vectorSpecification.vectorName,
                        data: entry.data,
                    }));

                    const historicalData = loadedHistoricalData.map((entry) => ({
                        vectorName: entry.vectorSpecification.vectorName,
                        data: entry.data,
                    }));

                    const observationData = loadedObservationData.map((entry) => ({
                        vectorName: entry.vectorSpecification.vectorName,
                        data: entry.data,
                    }));

                    // Assemble csv files in web worker to avoid blocking the main thread.
                    const files = await csvAssemblyWorker.assembleCsvFiles(
                        visualizationMode,
                        realizationData,
                        statisticsData,
                        historicalData,
                        observationData,
                        statisticsSelection,
                        showHistorical,
                        showObservations,
                    );

                    if (cancelled || files.length === 0) {
                        return;
                    }
                    const zipFilename = createZipFilename("SimulationTimeSeries");

                    const endTime = performance.now();
                    // TODO: remove
                    console.log(`Assembling CSV files took ${endTime - startTime} milliseconds.`);

                    const downloadStartTime = performance.now();
                    await downloadZip(
                        files.map((f: { filename: string; csvContent: string }) => ({
                            filename: f.filename,
                            content: f.csvContent,
                        })),
                        zipFilename,
                    );
                    const downloadEndTime = performance.now();

                    // TODO: remove
                    console.log(`Downloading ZIP file took ${downloadEndTime - downloadStartTime} milliseconds.`);
                } catch (error) {
                    console.error("Error assembling or downloading CSV files:", error);
                }
            }

            // Run async function without awaiting it, since we don't want to block the effect cleanup
            // while the CSV is being assembled and downloaded. The cleanup will set `cancelled` to true,
            // which the async function can check to abort if needed.
            run();

            return () => {
                cancelled = true;
            };
        },
        // Only trigger on counter change — the other values are captured from the current render's closure.
        // Intentionally excluding data deps so that changing settings mid-download doesn't cancel it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [csvDownloadRequestCounter],
    );
}
