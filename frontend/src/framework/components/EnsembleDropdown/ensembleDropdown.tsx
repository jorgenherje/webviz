import { DeltaEnsemble } from "@framework/DeltaEnsemble";
import { EnsembleSet } from "@framework/EnsembleSet";
import { ColorTile } from "@lib/components/ColorTile";
import { Dropdown, DropdownOption, DropdownProps } from "@lib/components/Dropdown";

export type EnsembleDropdownProps = {
    ensembleSet: EnsembleSet;
    allowDeltaEnsembles?: boolean;
    value: string | null;
    onChange: (ensembleIdent: string | null) => void;
} & Omit<DropdownProps<string>, "options" | "value" | "onChange">;

export function EnsembleDropdown(props: EnsembleDropdownProps): JSX.Element {
    const { ensembleSet, allowDeltaEnsembles, value, onChange, ...rest } = props;

    function handleSelectionChanged(selectedEnsembleIdentStr: string) {
        const foundEnsemble = ensembleSet.findEnsemble(selectedEnsembleIdentStr);

        if (!foundEnsemble || (!allowDeltaEnsembles && foundEnsemble instanceof DeltaEnsemble)) {
            onChange(null);
            return;
        }

        onChange(foundEnsemble.getIdent());
    }

    const optionsArray: DropdownOption[] = [];
    const ensembleArray = allowDeltaEnsembles ? ensembleSet.getEnsembleArray() : ensembleSet.getRegularEnsembleArray();
    for (const ens of ensembleArray) {
        optionsArray.push({
            value: ens.getIdent(),
            label: ens.getDisplayName(),
            adornment: (
                <span className="w-5">
                    <ColorTile color={ens.getColor()} />
                </span>
            ),
        });
    }

    return <Dropdown options={optionsArray} value={value?.toString()} onChange={handleSelectionChanged} {...rest} />;
}
