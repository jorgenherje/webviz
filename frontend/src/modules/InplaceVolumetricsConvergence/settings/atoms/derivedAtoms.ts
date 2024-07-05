import { FluidZone_api, InplaceVolumetricResultName_api, InplaceVolumetricsIdentifierWithValues_api } from "@api";
import { EnsembleSetAtom } from "@framework/GlobalAtoms";
import { fixupEnsembleIdents } from "@framework/utils/ensembleUiHelpers";

import { atom } from "jotai";

import {
    userSelectedEnsembleIdentsAtom,
    userSelectedFluidZonesAtom,
    userSelectedIdentifiersValuesAtom,
    userSelectedResultNameAtom,
    userSelectedTableNamesAtom,
} from "./baseAtoms";
import { tableDefinitionsQueryAtom } from "./queryAtoms";

import {
    InplaceVolumetricsTableDefinitionsAccessor,
    makeUniqueTableNamesIntersection,
} from "../utils/inplaceVolumetricsTableDefinitionsAccessor";

export const selectedEnsembleIdentsAtom = atom((get) => {
    const ensembleSet = get(EnsembleSetAtom);
    const userSelectedEnsembleIdents = get(userSelectedEnsembleIdentsAtom);

    if (!userSelectedEnsembleIdents) {
        if (ensembleSet.getEnsembleArr().length === 0) {
            return [];
        }
        return [ensembleSet.getEnsembleArr()[0].getIdent()];
    }

    const newSelectedEnsembleIdents = userSelectedEnsembleIdents.filter((ensemble) =>
        ensembleSet.hasEnsemble(ensemble)
    );

    const validatedEnsembleIdents = fixupEnsembleIdents(newSelectedEnsembleIdents, ensembleSet);

    return validatedEnsembleIdents ?? [];
});

export const tableDefinitionsAccessorAtom = atom<InplaceVolumetricsTableDefinitionsAccessor>((get) => {
    const selectedTableNames = get(selectedTableNamesAtom);
    const tableDefinitions = get(tableDefinitionsQueryAtom);

    return new InplaceVolumetricsTableDefinitionsAccessor(
        tableDefinitions.isLoading ? [] : tableDefinitions.data,
        selectedTableNames
    );
});

export const selectedTableNamesAtom = atom<string[]>((get) => {
    const userSelectedTableNames = get(userSelectedTableNamesAtom);
    const tableDefinitionsQueryResult = get(tableDefinitionsQueryAtom);

    const uniqueTableNames = makeUniqueTableNamesIntersection(tableDefinitionsQueryResult.data);

    if (!userSelectedTableNames) {
        return uniqueTableNames;
    }

    return fixupUserSelection(userSelectedTableNames, uniqueTableNames);
});

export const selectedFluidZonesAtom = atom<FluidZone_api[]>((get) => {
    const userSelectedFluidZones = get(userSelectedFluidZonesAtom);
    const tableDefinitionsAccessor = get(tableDefinitionsAccessorAtom);

    if (!userSelectedFluidZones) {
        return tableDefinitionsAccessor.getUniqueFluidZones();
    }

    return fixupUserSelection(userSelectedFluidZones, tableDefinitionsAccessor.getUniqueFluidZones());
});

export const selectedResultNameAtom = atom<InplaceVolumetricResultName_api | null>((get) => {
    const userSelectedResultName = get(userSelectedResultNameAtom);
    const tableDefinitionsAccessor = get(tableDefinitionsAccessorAtom);

    if (!userSelectedResultName) {
        if (tableDefinitionsAccessor.getUniqueResultNames().length === 0) {
            return null;
        }
        return tableDefinitionsAccessor.getUniqueResultNames()[0];
    }

    const fixedSelection = fixupUserSelection(
        [userSelectedResultName],
        tableDefinitionsAccessor.getUniqueResultNames()
    );
    if (fixedSelection.length === 0) {
        return null;
    }

    return fixedSelection[0];
});

export const selectedIdentifiersValuesAtom = atom<InplaceVolumetricsIdentifierWithValues_api[]>((get) => {
    const userSelectedIdentifierValues = get(userSelectedIdentifiersValuesAtom);
    const tableDefinitionsAccessor = get(tableDefinitionsAccessorAtom);

    const uniqueIdentifierValues = tableDefinitionsAccessor.getUniqueIndexFilterValues();
    const fixedUpIdentifierValues: InplaceVolumetricsIdentifierWithValues_api[] = [];

    if (!userSelectedIdentifierValues) {
        for (const entry of uniqueIdentifierValues) {
            fixedUpIdentifierValues.push({
                identifier: entry.identifier,
                values: fixupUserSelection(
                    entry.values,
                    uniqueIdentifierValues.find((el) => el.identifier === entry.identifier)?.values ?? []
                ),
            });
        }
        return fixedUpIdentifierValues;
    }

    for (const entry of userSelectedIdentifierValues) {
        fixedUpIdentifierValues.push({
            identifier: entry.identifier,
            values: fixupUserSelection(
                entry.values,
                uniqueIdentifierValues.find((el) => el.identifier === entry.identifier)?.values ?? []
            ),
        });
    }

    return fixedUpIdentifierValues;
});

function fixupUserSelection<TSelection>(userSelection: TSelection[], validOptions: TSelection[]): TSelection[] {
    const newSelections = userSelection.filter((selection) => validOptions.includes(selection));
    if (newSelections.length === 0 && validOptions.length > 0) {
        newSelections.push(validOptions[0]);
    }

    return newSelections;
}