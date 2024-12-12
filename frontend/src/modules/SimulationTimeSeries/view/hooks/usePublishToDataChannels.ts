import { VectorRealizationData_api } from "@api";
import { ChannelContentDefinition } from "@framework/DataChannelTypes";
import { EnsembleIdent } from "@framework/EnsembleIdent";
import { ViewContext } from "@framework/ModuleContext";
import { Interfaces } from "@modules/SimulationTimeSeries/interfaces";
import { VectorSpec } from "@modules/SimulationTimeSeries/typesAndEnums";

import { useAtomValue } from "jotai";

import { useMakeEnsembleDisplayNameFunc } from "./useMakeEnsembleDisplayNameFunc";

import { ChannelIds } from "../../channelDefs";
import { makeVectorGroupDataGenerator } from "../../dataGenerators";
import {
    activeTimestampUtcMsAtom,
    loadedVectorSpecificationsAndRealizationDataAtom,
    queryIsFetchingAtom,
} from "../atoms/derivedAtoms";

export function usePublishToDataChannels(viewContext: ViewContext<Interfaces>) {
    const loadedVectorSpecificationsAndRealizationData = useAtomValue(loadedVectorSpecificationsAndRealizationDataAtom);
    const activeTimestampUtcMs = useAtomValue(activeTimestampUtcMsAtom);
    const isQueryFetching = useAtomValue(queryIsFetchingAtom);

    const makeEnsembleDisplayName = useMakeEnsembleDisplayNameFunc(viewContext);

    // Only publish regular ensemble data to the time series channel
    const regularEnsembleVectorSpecificationsAndRealizationData: {
        vectorSpecification: VectorSpec;
        data: VectorRealizationData_api[];
    }[] = [];
    for (const elm of loadedVectorSpecificationsAndRealizationData) {
        if (!EnsembleIdent.isValidRegularEnsembleIdentString(elm.vectorSpecification.ensembleIdent)) {
            continue;
        }

        regularEnsembleVectorSpecificationsAndRealizationData.push({
            vectorSpecification: elm.vectorSpecification,
            data: elm.data,
        });
    }

    const contents: ChannelContentDefinition[] = [];
    for (const elm of regularEnsembleVectorSpecificationsAndRealizationData) {
        contents.push({
            contentIdString: `${elm.vectorSpecification.vectorName}-::-${elm.vectorSpecification.ensembleIdent}`,
            displayName: `${elm.vectorSpecification.vectorName} (${makeEnsembleDisplayName(
                elm.vectorSpecification.ensembleIdent
            )})`,
            dataGenerator: makeVectorGroupDataGenerator(
                elm.vectorSpecification,
                regularEnsembleVectorSpecificationsAndRealizationData,
                activeTimestampUtcMs ?? 0,
                makeEnsembleDisplayName
            ),
        });
    }

    viewContext.usePublishChannelContents({
        channelIdString: ChannelIds.TIME_SERIES,
        dependencies: [regularEnsembleVectorSpecificationsAndRealizationData, activeTimestampUtcMs],
        enabled: !isQueryFetching,
        contents,
    });
}
