import { VectorRealizationData_api } from "@api";
import { ChannelContentMetaData, DataGenerator } from "@framework/DataChannelTypes";
import { simulationUnitReformat, simulationVectorDescription } from "@modules/_shared/reservoirSimulationStringUtils";

import { VectorSpec } from "./typesAndEnums";

export function makeVectorGroupDataGenerator(
    regularEnsembleVectorSpecification: VectorSpec,
    regularEnsembleVectorSpecificationsAndRealizationData: {
        vectorSpecification: VectorSpec;
        data: VectorRealizationData_api[];
    }[],
    activeTimestampUtcMs: number,
    makeEnsembleDisplayName: (ensembleIdent: string) => string
): DataGenerator {
    return () => {
        const data: { key: number; value: number }[] = [];
        let metaData: ChannelContentMetaData = {
            unit: "",
            ensembleIdent: "",
            displayString: "",
        };

        const vector = regularEnsembleVectorSpecificationsAndRealizationData.find(
            (vec) =>
                vec.vectorSpecification.vectorName === regularEnsembleVectorSpecification.vectorName &&
                vec.vectorSpecification.ensembleIdent === regularEnsembleVectorSpecification.ensembleIdent
        );

        if (vector) {
            let unit = "";
            vector.data.forEach((el) => {
                unit = simulationUnitReformat(el.unit);
                const indexOfTimestamp = el.timestamps_utc_ms.indexOf(activeTimestampUtcMs);
                data.push({
                    key: el.realization,
                    value: indexOfTimestamp === -1 ? el.values[0] : el.values[indexOfTimestamp],
                });
            });
            metaData = {
                unit,
                ensembleIdent: vector.vectorSpecification.ensembleIdent,
                displayString: `${simulationVectorDescription(
                    vector.vectorSpecification.vectorName
                )} (${makeEnsembleDisplayName(vector.vectorSpecification.ensembleIdent)})`,
            };
        }
        return {
            data,
            metaData: metaData ?? undefined,
        };
    };
}
