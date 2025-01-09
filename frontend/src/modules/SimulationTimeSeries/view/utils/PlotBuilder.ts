import React from "react";

import {
    SummaryVectorObservations_api,
    VectorHistoricalData_api,
    VectorRealizationData_api,
    VectorStatisticData_api,
} from "@api";
import { DeltaEnsembleIdent } from "@framework/DeltaEnsembleIdent";
import { RegularEnsembleIdent } from "@framework/RegularEnsembleIdent";
import { isEnsembleIdentOfType } from "@framework/utils/ensembleIdentUtils";
import { ColorSet } from "@lib/utils/ColorSet";
import { VectorSpec } from "@modules/SimulationTimeSeries/typesAndEnums";
import { Figure, makeSubplots } from "@modules/_shared/Figure";
import { simulationUnitReformat, simulationVectorDescription } from "@modules/_shared/reservoirSimulationStringUtils";

import {
    createHistoricalVectorTrace,
    createVectorFanchartTraces,
    createVectorObservationsTraces,
    createVectorRealizationTrace,
    createVectorRealizationTraces,
    createVectorStatisticsTraces,
} from "./PlotlyTraceUtils/createVectorTracesUtils";
import { scaleHexColorLightness } from "./colorUtils";
import { EnsemblesContinuousParameterColoring } from "./ensemblesContinuousParameterColoring";

type VectorNameUnitMap = { [vectorName: string]: string };
type HexColorMap = { [key: string]: string };
export enum SubplotOwner {
    VECTOR = "Vector",
    ENSEMBLE = "Ensemble",
}

/**
    Helper class to build wanted plot component by use of plot figure, with subplot per selected vector
    or per selected ensemble according to grouping selection.

 */
export class PlotBuilder {
    private _selectedVectorSpecifications: VectorSpec[] = [];
    private _numberOfSubplots = 0;
    private _subplotOwner: SubplotOwner;

    private _addedVectorsLegendTracker: string[] = [];
    private _addedEnsemblesLegendTracker: (RegularEnsembleIdent | DeltaEnsembleIdent)[] = [];

    private _uniqueEnsembleIdents: (RegularEnsembleIdent | DeltaEnsembleIdent)[] = [];
    private _uniqueVectorNames: string[] = [];

    private _vectorHexColors: HexColorMap = {};

    private _makeEnsembleDisplayName: (ensembleIdent: RegularEnsembleIdent | DeltaEnsembleIdent) => string;

    private _hasRealizationsTracesColoredByParameter = false;
    private _hasHistoryTraces = false;
    private _hasObservationTraces = false;

    private _historyVectorColor = "black";
    private _observationColor = "black";

    private _width = 0;
    private _height = 0;

    private _defaultHoverTemplate = "(%{x}, %{y})<br>";
    private _scatterType: "scatter" | "scattergl";

    private _ensemblesParameterColoring: EnsemblesContinuousParameterColoring | null = null;
    private _parameterFallbackColor = "#808080";

    private _traceFallbackColor = "#000000";

    private _vectorNameUnitMap: VectorNameUnitMap = {};

    private _timeAnnotationTimestamps: number[] = [];

    private _figure: Figure;
    private _numRows = 1;
    private _numCols = 1;
    private _subplotTitles: string[] = [];

    constructor(
        subplotOwner: SubplotOwner,
        selectedVectorSpecifications: VectorSpec[],
        makeEnsembleDisplayName: (ensembleIdent: RegularEnsembleIdent | DeltaEnsembleIdent) => string,
        colorSet: ColorSet,
        width: number,
        height: number,
        ensemblesParameterColoring?: EnsemblesContinuousParameterColoring,
        scatterType: "scatter" | "scattergl" = "scatter"
    ) {
        this._selectedVectorSpecifications = selectedVectorSpecifications;
        this._width = width;
        this._height = height;
        this._makeEnsembleDisplayName = makeEnsembleDisplayName;

        this._uniqueVectorNames = [...new Set(selectedVectorSpecifications.map((vec) => vec.vectorName))];
        this._uniqueEnsembleIdents = [];
        for (const vectorSpecification of selectedVectorSpecifications) {
            if (this._uniqueEnsembleIdents.some((elm) => elm.equals(vectorSpecification.ensembleIdent))) continue;
            this._uniqueEnsembleIdents.push(vectorSpecification.ensembleIdent);
        }

        // Create map with color for each vector and ensemble
        this._uniqueVectorNames.forEach((vectorName, index) => {
            const color = index === 0 ? colorSet.getFirstColor() : colorSet.getNextColor();
            this._vectorHexColors[vectorName] = color;
        });

        this._ensemblesParameterColoring = ensemblesParameterColoring ?? null;
        this._scatterType = scatterType;

        this._subplotOwner = subplotOwner;
        this._numberOfSubplots =
            this._subplotOwner === SubplotOwner.VECTOR
                ? this._uniqueVectorNames.length
                : this._uniqueEnsembleIdents.length;

        // NOTE: Fix order of subplot titles, or consider a map between row/col and title?
        if (this._subplotOwner === SubplotOwner.VECTOR) {
            this._numberOfSubplots = this._uniqueVectorNames.length;
            this._subplotTitles = this._uniqueVectorNames
                .map((vectorName) => this.createVectorSubplotTitle(vectorName))
                .reverse();
        } else if (this._subplotOwner === SubplotOwner.ENSEMBLE) {
            this._numberOfSubplots = this._uniqueEnsembleIdents.length;
            this._subplotTitles = this._uniqueEnsembleIdents.map(
                (ensembleIdent) => `Ensemble: ${this._makeEnsembleDisplayName(ensembleIdent)}`
            );
        }

        // TODO: Order subplot titles s.t. they match the order of the subplots top-left to bottom-right,
        // get issues as the

        // Create figure
        ({ numRows: this._numRows, numCols: this._numCols } = this.calcNumRowsAndCols(this._numberOfSubplots));
        this._figure = makeSubplots({
            numCols: this._numCols,
            numRows: this._numRows,
            height: this._height,
            width: this._width,
            margin: { t: 30, b: 40, l: 0, r: 0 },
            subplotTitles: this._subplotTitles,
            xAxisType: "date",
            sharedXAxes: "all",
        });

        // TODO:
        // - Handle keep uirevision?
        // - Assign same color to vector independent of order in vector list?
    }

    private calcNumRowsAndCols(numSubplots: number): { numRows: number; numCols: number } {
        if (numSubplots === 1) {
            return { numRows: 1, numCols: 1 };
        }

        const numRows = Math.ceil(Math.sqrt(numSubplots));
        const numCols = Math.ceil(numSubplots / numRows);

        return { numRows, numCols };
    }

    /**
     * Get index of subplot for vector specification
     */
    private getSubplotIndex(vectorSpecification: VectorSpec) {
        if (this._subplotOwner === SubplotOwner.VECTOR) {
            return this._uniqueVectorNames.indexOf(vectorSpecification.vectorName);
        } else if (this._subplotOwner === SubplotOwner.ENSEMBLE) {
            return this._uniqueEnsembleIdents.findIndex((elm) => elm.equals(vectorSpecification.ensembleIdent));
        }
        return -1;
    }

    /**
     * Get row and column number for subplot from subplot index
     *
     * The subplot index is 0-based, whilst the row and column numbers are 1-based.
     *
     * The subplots for plotly are arranged in a grid with columns from left to right, and
     * rows from bottom to top. This implies with the following layout for a 3x3 grid (r1 = row 1, c1 = column 1):
     *
     *              r3c1 r3c2 r3c3
     *              r2c1 r2c2 r2c3
     *              r1c1 r1c2 r1c3
     *
     */
    private getSubplotRowAndColFromIndex(index: number): { row: number; col: number } {
        const row = this._numRows - Math.floor(index / this._numCols);
        // const row = Math.floor(index / this._numCols) + 1;
        const col = (index % this._numCols) + 1;

        if (row > this._numRows || col > this._numCols) {
            throw new Error("Subplot index out of bounds");
        }

        return { row, col };
    }

    build(handleOnClick?: ((event: Readonly<Plotly.PlotMouseEvent>) => void) | undefined): React.ReactNode {
        return this._figure.makePlot(handleOnClick);
    }

    addRealizationTracesColoredByParameter(
        vectorsRealizationData: { vectorSpecification: VectorSpec; data: VectorRealizationData_api[] }[]
    ): void {
        if (!this._ensemblesParameterColoring) {
            throw new Error(
                "EnsemblesParameterColoring is not defined. Must be provided in PlotBuilder constructor to add realization traces colored by parameter"
            );
        }

        // Only allow selected vectors
        const selectedVectorsRealizationData = vectorsRealizationData.filter((vec) =>
            this._selectedVectorSpecifications.some(
                (selectedVec) => selectedVec.vectorName === vec.vectorSpecification.vectorName
            )
        );

        const addLegendForTraces = false;

        // Create traces for each vector
        for (const elm of selectedVectorsRealizationData) {
            const subplotIndex = this.getSubplotIndex(elm.vectorSpecification);
            if (subplotIndex === -1) continue;

            const ensembleIdent = elm.vectorSpecification.ensembleIdent;

            // As of now only regular ensembles are supported
            if (!isEnsembleIdentOfType(ensembleIdent, RegularEnsembleIdent)) continue;

            const hasParameterForEnsemble = this._ensemblesParameterColoring.hasParameterForEnsemble(ensembleIdent);

            // Add traces for each realization with color based on parameter value
            for (const realizationData of elm.data) {
                let parameterColor = this._parameterFallbackColor;
                const hasParameterValueForRealization = this._ensemblesParameterColoring.hasParameterRealizationValue(
                    ensembleIdent,
                    realizationData.realization
                );

                if (hasParameterForEnsemble && hasParameterValueForRealization) {
                    const value = this._ensemblesParameterColoring.getParameterRealizationValue(
                        ensembleIdent,
                        realizationData.realization
                    );
                    parameterColor = this._ensemblesParameterColoring.getColorScale().getColorForValue(value);
                }

                const name = this.makeTraceNameFromVectorSpecification(elm.vectorSpecification);
                const vectorRealizationTrace = createVectorRealizationTrace({
                    vectorRealizationData: realizationData,
                    name: name,
                    color: parameterColor,
                    legendGroup: this._makeEnsembleDisplayName(elm.vectorSpecification.ensembleIdent),
                    hoverTemplate: this._defaultHoverTemplate,
                    showLegend: addLegendForTraces,
                    yaxis: `y${subplotIndex + 1}`,
                    type: this._scatterType,
                });

                const { row, col } = this.getSubplotRowAndColFromIndex(subplotIndex);
                this._figure.addTrace(vectorRealizationTrace, row, col);

                this._hasRealizationsTracesColoredByParameter = true;
                this.insertVectorNameAndUnitIntoMap(elm.vectorSpecification.vectorName, realizationData.unit);
            }
        }
    }

    addRealizationsTraces(
        vectorsRealizationData: { vectorSpecification: VectorSpec; data: VectorRealizationData_api[] }[],
        useIncreasedBrightness: boolean
    ): void {
        // Only allow selected vectors
        const selectedVectorsRealizationData = vectorsRealizationData.filter((vec) =>
            this._selectedVectorSpecifications.some(
                (selectedVec) => selectedVec.vectorName === vec.vectorSpecification.vectorName
            )
        );

        const addLegendForTraces = false;

        // Create traces for each vector
        for (const elm of selectedVectorsRealizationData) {
            const subplotIndex = this.getSubplotIndex(elm.vectorSpecification);
            if (subplotIndex === -1) continue;

            // Get legend group and color
            const legendGroup = this.getLegendGroupAndUpdateTracker(elm.vectorSpecification);
            let color = this.getHexColor(elm.vectorSpecification);
            if (useIncreasedBrightness) {
                color = scaleHexColorLightness(color, 1.3) ?? color;
            }

            const name = this.makeTraceNameFromVectorSpecification(elm.vectorSpecification);
            const vectorRealizationTraces = createVectorRealizationTraces({
                vectorRealizationsData: elm.data,
                name: name,
                color: color,
                legendGroup: legendGroup,
                hoverTemplate: this._defaultHoverTemplate,
                showLegend: addLegendForTraces,
                type: this._scatterType,
            });

            const { row, col } = this.getSubplotRowAndColFromIndex(subplotIndex);
            this._figure.addTraces(vectorRealizationTraces, row, col);

            if (elm.data.length !== 0) {
                this.insertVectorNameAndUnitIntoMap(elm.vectorSpecification.vectorName, elm.data[0].unit);
            }
        }
    }

    addFanchartTraces(
        vectorsStatisticData: { vectorSpecification: VectorSpec; data: VectorStatisticData_api }[]
    ): void {
        // Only allow selected vectors
        const selectedVectorsStatisticData = vectorsStatisticData.filter((vec) =>
            this._selectedVectorSpecifications.some(
                (selectedVec) => selectedVec.vectorName === vec.vectorSpecification.vectorName
            )
        );

        // Create traces for each vector
        for (const elm of selectedVectorsStatisticData) {
            const subplotIndex = this.getSubplotIndex(elm.vectorSpecification);
            if (subplotIndex === -1) continue;

            // Get legend group and color
            const legendGroup = this.getLegendGroupAndUpdateTracker(elm.vectorSpecification);
            const color = this.getHexColor(elm.vectorSpecification);

            const name = this.makeTraceNameFromVectorSpecification(elm.vectorSpecification);
            const vectorFanchartTraces = createVectorFanchartTraces({
                vectorStatisticData: elm.data,
                hexColor: color,
                legendGroup: legendGroup,
                name: name,
                yaxis: `y${subplotIndex + 1}`,
                type: this._scatterType,
            });

            const { row, col } = this.getSubplotRowAndColFromIndex(subplotIndex);
            this._figure.addTraces(vectorFanchartTraces, row, col);

            this.insertVectorNameAndUnitIntoMap(elm.vectorSpecification.vectorName, elm.data.unit);
        }
    }

    addStatisticsTraces(
        vectorsStatisticData: { vectorSpecification: VectorSpec; data: VectorStatisticData_api }[],
        highlightStatisticTraces: boolean
    ): void {
        // Only allow selected vectors
        const selectedVectorsStatisticData = vectorsStatisticData.filter((vec) =>
            this._selectedVectorSpecifications.some(
                (selectedVec) => selectedVec.vectorName === vec.vectorSpecification.vectorName
            )
        );

        const lineWidth = highlightStatisticTraces ? 3 : 2;

        // Create traces for each vector
        for (const elm of selectedVectorsStatisticData) {
            const subplotIndex = this.getSubplotIndex(elm.vectorSpecification);
            if (subplotIndex === -1) continue;

            // Get legend group and color
            const legendGroup = this.getLegendGroupAndUpdateTracker(elm.vectorSpecification);
            const color = this.getHexColor(elm.vectorSpecification);

            const name = this.makeTraceNameFromVectorSpecification(elm.vectorSpecification);
            const vectorStatisticsTraces = createVectorStatisticsTraces({
                vectorStatisticData: elm.data,
                hexColor: color,
                legendGroup: legendGroup,
                name: name,
                lineWidth: lineWidth,
                type: this._scatterType,
            });

            const { row, col } = this.getSubplotRowAndColFromIndex(subplotIndex);
            this._figure.addTraces(vectorStatisticsTraces, row, col);

            this.insertVectorNameAndUnitIntoMap(elm.vectorSpecification.vectorName, elm.data.unit);
        }
    }

    addHistoryTraces(
        vectorsHistoricalData: {
            vectorSpecification: VectorSpec;
            data: VectorHistoricalData_api;
        }[]
    ): void {
        // Only allow selected vectors
        const selectedVectorsHistoricalData = vectorsHistoricalData.filter((vec) =>
            this._selectedVectorSpecifications.some(
                (selectedVec) => selectedVec.vectorName === vec.vectorSpecification.vectorName
            )
        );

        // Create traces for each vector
        for (const elm of selectedVectorsHistoricalData) {
            const subplotIndex = this.getSubplotIndex(elm.vectorSpecification);
            if (subplotIndex === -1) continue;

            const name = this.makeTraceNameFromVectorSpecification(elm.vectorSpecification);
            const vectorHistoryTrace = createHistoricalVectorTrace({
                vectorHistoricalData: elm.data,
                name: name,
                color: this._historyVectorColor,
                type: this._scatterType,
            });

            const { row, col } = this.getSubplotRowAndColFromIndex(subplotIndex);
            this._figure.addTrace(vectorHistoryTrace, row, col);

            this._hasHistoryTraces = true;
            this.insertVectorNameAndUnitIntoMap(elm.vectorSpecification.vectorName, elm.data.unit);
        }
    }

    addObservationsTraces(
        vectorsObservationData: {
            vectorSpecification: VectorSpec;
            data: SummaryVectorObservations_api;
        }[]
    ): void {
        // Only allow selected vectors
        const selectedVectorsObservationData = vectorsObservationData.filter((vec) =>
            this._selectedVectorSpecifications.some(
                (selectedVec) => selectedVec.vectorName === vec.vectorSpecification.vectorName
            )
        );

        // Create traces for each vector
        for (const elm of selectedVectorsObservationData) {
            const subplotIndex = this.getSubplotIndex(elm.vectorSpecification);
            if (subplotIndex === -1) continue;

            const name = this.makeTraceNameFromVectorSpecification(elm.vectorSpecification);
            const vectorObservationsTraces = createVectorObservationsTraces({
                vectorObservations: elm.data.observations,
                name: name,
                color: this._observationColor,
                type: this._scatterType,
            });

            const { row, col } = this.getSubplotRowAndColFromIndex(subplotIndex);
            this._figure.addTraces(vectorObservationsTraces, row, col);

            this._hasObservationTraces = true;
        }
    }

    private getLegendGroupAndUpdateTracker(vectorSpecification: VectorSpec): string {
        // Subplot per vector, keep track of added ensembles
        // Subplot per ensemble, keep track of added vectors
        if (this._subplotOwner === SubplotOwner.VECTOR) {
            const ensembleIdent = vectorSpecification.ensembleIdent;
            if (!this._addedEnsemblesLegendTracker.some((elm) => elm.equals(ensembleIdent))) {
                this._addedEnsemblesLegendTracker.push(ensembleIdent);
            }
            return ensembleIdent.toString();
        } else if (this._subplotOwner === SubplotOwner.ENSEMBLE) {
            const vectorName = vectorSpecification.vectorName;
            if (!this._addedVectorsLegendTracker.includes(vectorName)) {
                this._addedVectorsLegendTracker.push(vectorName);
            }
            return vectorName;
        }
        return "";
    }

    private getHexColor(vectorSpecification: VectorSpec): string {
        if (this._subplotOwner === SubplotOwner.VECTOR) {
            const hexColor = vectorSpecification.color;
            return hexColor ?? this._traceFallbackColor;
        } else if (this._subplotOwner === SubplotOwner.ENSEMBLE) {
            return this._vectorHexColors[vectorSpecification.vectorName];
        }
        return this._traceFallbackColor;
    }

    private insertVectorNameAndUnitIntoMap(vectorName: string, unit: string): void {
        if (vectorName in this._vectorNameUnitMap) return;

        this._vectorNameUnitMap[vectorName] = unit;
    }

    private createVectorSubplotTitle(vectorName: string): string {
        const vectorDescription = simulationVectorDescription(vectorName);
        const unit = this._vectorNameUnitMap[vectorName];
        if (!unit) return vectorDescription;

        return `${vectorDescription} [${simulationUnitReformat(unit)}]`;
    }

    private makeTraceNameFromVectorSpecification(vectorSpecification: VectorSpec): string {
        return this._subplotOwner === SubplotOwner.ENSEMBLE
            ? vectorSpecification.vectorName
            : this._makeEnsembleDisplayName(vectorSpecification.ensembleIdent);
    }
}
