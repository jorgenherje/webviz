import { ContinuousParameter, ParameterIdent, ParameterType } from "@framework/EnsembleParameters";
import { RegularEnsemble } from "@framework/RegularEnsemble";
import { ColorScale } from "@lib/utils/ColorScale";
import { MinMax } from "@lib/utils/MinMax";

export class EnsemblesContinuousParameterColoring {
    /**
     * Helper class working with coloring according to selected continuous parameter across multiple ensembles
     *
     * Retrieves min/max parameter value across all ensembles and provides interface for retrieving parameter
     * value within the min/max range for specific realization in ensemble.
     */

    private _parameterIdent: ParameterIdent;
    private _regularEnsembleContinuousParameterMap: Map<string, ContinuousParameter>;
    private _colorScale: ColorScale;

    constructor(selectedRegularEnsembles: RegularEnsemble[], parameterIdent: ParameterIdent, colorScale: ColorScale) {
        this._parameterIdent = parameterIdent;
        this._regularEnsembleContinuousParameterMap = new Map<string, ContinuousParameter>();
        let minMax = MinMax.createInvalid();
        for (const ensemble of selectedRegularEnsembles) {
            const ensembleParameters = ensemble.getParameters();
            const parameter = ensembleParameters.findParameter(parameterIdent);
            if (!parameter || parameter.type !== ParameterType.CONTINUOUS) continue;

            this._regularEnsembleContinuousParameterMap.set(ensemble.getIdent(), parameter);
            minMax = minMax.extendedBy(ensembleParameters.getContinuousParameterMinMax(parameterIdent));
        }

        // Consider: Set Range [0,0] if parameterMinMax is invalid?
        this._colorScale = colorScale;
        const midValue = minMax.min + (minMax.max - minMax.min) / 2;
        this._colorScale.setRangeAndMidPoint(minMax.min, minMax.max, midValue);
    }

    getParameterDisplayName(): string {
        if (!this._parameterIdent.groupName) return this._parameterIdent.name;

        return `${this._parameterIdent.groupName}:${this._parameterIdent.name}`;
    }

    getColorScale(): ColorScale {
        return this._colorScale;
    }

    hasParameterForEnsemble(ensembleIdent: string): boolean {
        return this._regularEnsembleContinuousParameterMap.has(ensembleIdent);
    }

    hasParameterRealizationValue(ensembleIdent: string, realization: number): boolean {
        const parameter = this._regularEnsembleContinuousParameterMap.get(ensembleIdent);
        if (parameter === undefined) return false;

        return parameter.realizations.indexOf(realization) !== -1;
    }

    getParameterRealizationValue(ensembleIdent: string, realization: number): number {
        if (!this.hasParameterRealizationValue(ensembleIdent, realization)) {
            throw new Error(
                `Parameter ${this.getParameterDisplayName()} has no numerical value for realization ${realization} in ensemble ${ensembleIdent}`
            );
        }
        const parameter = this._regularEnsembleContinuousParameterMap.get(ensembleIdent);
        if (parameter === undefined) {
            throw new Error(`Parameter ${this.getParameterDisplayName()} not found in ensemble ${ensembleIdent}`);
        }
        const realizationIndex = parameter.realizations.indexOf(realization);
        return parameter.values[realizationIndex];
    }
}
