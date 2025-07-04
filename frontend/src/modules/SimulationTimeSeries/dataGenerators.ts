import type { VectorRealizationData_api } from "@api";
import type { ChannelContentMetaData, DataGenerator } from "@framework/DataChannelTypes";
import type { RegularEnsembleIdent } from "@framework/RegularEnsembleIdent";
import { simulationUnitReformat, simulationVectorDescription } from "@modules/_shared/reservoirSimulationStringUtils";

import type { VectorSpec } from "./typesAndEnums";

// As of now, the publish to data channels only supports regular ensembles
export interface RegularEnsembleVectorSpec extends VectorSpec {
    ensembleIdent: RegularEnsembleIdent;
}

export function makeVectorGroupDataGenerator(
    regularEnsembleVectorSpecification: RegularEnsembleVectorSpec,
    regularEnsembleVectorSpecificationsAndRealizationData: {
        vectorSpecification: RegularEnsembleVectorSpec;
        data: VectorRealizationData_api[];
    }[],
    activeTimestampUtcMs: number,
    makeEnsembleDisplayName: (ensembleIdent: RegularEnsembleIdent) => string,
    preferredColor: string,
): DataGenerator {
    return () => {
        const data: { key: number; value: number }[] = [];
        let metaData: ChannelContentMetaData = {
            unit: "",
            ensembleIdentString: "",
            displayString: "",
        };

        const vector = regularEnsembleVectorSpecificationsAndRealizationData.find(
            (vec) =>
                vec.vectorSpecification.vectorName === regularEnsembleVectorSpecification.vectorName &&
                vec.vectorSpecification.ensembleIdent.equals(regularEnsembleVectorSpecification.ensembleIdent),
        );

        if (vector) {
            let unit = "";
            vector.data.forEach((el) => {
                unit = simulationUnitReformat(el.unit);
                const indexOfTimestamp = el.timestampsUtcMs.indexOf(activeTimestampUtcMs);
                data.push({
                    key: el.realization,
                    value: indexOfTimestamp === -1 ? el.values[0] : el.values[indexOfTimestamp],
                });
            });
            metaData = {
                unit,
                ensembleIdentString: vector.vectorSpecification.ensembleIdent.toString(),
                displayString: `${simulationVectorDescription(
                    vector.vectorSpecification.vectorName,
                )} (${makeEnsembleDisplayName(vector.vectorSpecification.ensembleIdent)})`,
                preferredColor,
            };
        }
        return {
            data,
            metaData: metaData ?? undefined,
        };
    };
}
