import { ensembleIdentUuidRegexString, isEnsembleIdentOfType } from "./utils/ensembleIdentUtils";

export class RegularEnsembleIdent {
    private _caseUuid: string;
    private _ensembleName: string;

    constructor(caseUuid: string, ensembleName: string) {
        const uuidRegex = new RegExp(ensembleIdentUuidRegexString());
        if (!uuidRegex.exec(caseUuid)) {
            throw new Error(`Invalid caseUuid: ${caseUuid}`);
        }

        this._caseUuid = caseUuid;
        this._ensembleName = ensembleName;
    }

    static caseUuidAndEnsembleNameToString(caseUuid: string, ensembleName: string): string {
        return `${caseUuid}::${ensembleName}`;
    }

    static getEnsembleIdentRegex(): RegExp {
        return new RegExp(`^(?<caseUuid>${ensembleIdentUuidRegexString()})::(?<ensembleName>.*)$`);
    }

    static isValidEnsembleIdentString(ensembleIdentString: string): boolean {
        const regex = RegularEnsembleIdent.getEnsembleIdentRegex();
        const result = regex.exec(ensembleIdentString);
        return !!result && !!result.groups && !!result.groups.caseUuid && !!result.groups.ensembleName;
    }

    static fromString(ensembleIdentString: string): RegularEnsembleIdent {
        const regex = RegularEnsembleIdent.getEnsembleIdentRegex();
        const result = regex.exec(ensembleIdentString);
        if (!result || !result.groups || !result.groups.caseUuid || !result.groups.ensembleName) {
            throw new Error(`Invalid ensemble ident: ${ensembleIdentString}`);
        }

        const { caseUuid, ensembleName } = result.groups;

        return new RegularEnsembleIdent(caseUuid, ensembleName);
    }

    getCaseUuid(): string {
        return this._caseUuid;
    }

    getEnsembleName(): string {
        return this._ensembleName;
    }

    toString(): string {
        return RegularEnsembleIdent.caseUuidAndEnsembleNameToString(this._caseUuid, this._ensembleName);
    }

    equals(otherIdent: any | null): boolean {
        if (!otherIdent || !isEnsembleIdentOfType(otherIdent, RegularEnsembleIdent)) {
            return false;
        }
        if (otherIdent === this) {
            return true;
        }

        return this._caseUuid === otherIdent._caseUuid && this._ensembleName === otherIdent._ensembleName;
    }
}