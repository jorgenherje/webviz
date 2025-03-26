import { PreferredViewLayout } from "@modules/IntersectionNew/typesAndEnums";
import { LayerManager } from "@modules/_shared/LayerFramework/framework/LayerManager/LayerManager";
import { IntersectionSelection } from "@modules/_shared/components/IntersectionSelector/intersectionSelector";

import { atom } from "jotai";

export const userSelectedFieldIdentifierAtom = atom<string | null>(null);
export const layerManagerAtom = atom<LayerManager | null>(null);
export const preferredViewLayoutAtom = atom<PreferredViewLayout>(PreferredViewLayout.VERTICAL);
export const userSelectedIntersectionSelectionAtom = atom<IntersectionSelection | null>(null);
export const userSelectedIntersectionExtensionLengthAtom = atom<number>(1000);
