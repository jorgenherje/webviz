import { IntersectionSelection } from "@modules/_shared/components/IntersectionSelector/intersectionSelector";

import { atom } from "jotai";

export const selectedFieldIdentifierAtom = atom<string | null>(null);
export const selectedIntersectionSelectionAtom = atom<IntersectionSelection | null>(null);
