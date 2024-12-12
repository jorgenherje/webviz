import { EnsembleSet } from "@framework/EnsembleSet";
import { RegularEnsemble } from "@framework/RegularEnsemble";
import { ColorTile } from "@lib/components/ColorTile";
import { Select, SelectOption, SelectProps } from "@lib/components/Select";

export type EnsembleSelectProps = {
    ensembleSet: EnsembleSet;
    multiple?: boolean;
    allowDeltaEnsembles?: boolean;
    value: string[];
    onChange: (ensembleIdentArray: string[]) => void;
} & Omit<SelectProps<string>, "options" | "value" | "onChange">;

export function EnsembleSelect(props: EnsembleSelectProps): JSX.Element {
    const { ensembleSet, value, allowDeltaEnsembles, onChange, multiple, ...rest } = props;

    function handleSelectionChanged(selectedEnsembleIdentArray: string[]) {
        const identStringArray: string[] = [];
        for (const identStr of selectedEnsembleIdentArray) {
            const foundEnsemble = ensembleSet.findEnsemble(identStr);

            if (foundEnsemble && (allowDeltaEnsembles || foundEnsemble instanceof RegularEnsemble)) {
                identStringArray.push(foundEnsemble.getIdent());
            }
        }
        onChange(identStringArray);
    }

    const optionsArray: SelectOption[] = [];
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

    const selectedArray: string[] = [];
    for (const ident of value) {
        selectedArray.push(ident.toString());
    }

    const isMultiple = multiple ?? true;

    return (
        <Select
            options={optionsArray}
            value={selectedArray}
            onChange={handleSelectionChanged}
            multiple={isMultiple}
            {...rest}
        />
    );
}
