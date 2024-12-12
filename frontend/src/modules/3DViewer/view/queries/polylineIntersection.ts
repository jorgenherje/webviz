import { apiService } from "@framework/ApiService";
import { EnsembleIdent } from "@framework/EnsembleIdent";
import {
    PolylineIntersection_trans,
    transformPolylineIntersection,
} from "@modules/3DViewer/view/queries/queryDataTransforms";
import { UseQueryResult, useQuery } from "@tanstack/react-query";

export function useGridPolylineIntersection(
    ensembleIdent: string | null,
    gridModelName: string | null,
    gridModelParameterName: string | null,
    gridModelDateOrInterval: string | null,
    realizationNum: number | null,
    polyline_utm_xy: number[],
    enabled: boolean
): UseQueryResult<PolylineIntersection_trans> {
    let caseUuid = "";
    let ensembleName = "";
    if (ensembleIdent && EnsembleIdent.isValidRegularEnsembleIdentString(ensembleIdent)) {
        ({ caseUuid, ensembleName } = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(ensembleIdent));
    }

    return useQuery({
        queryKey: [
            "getGridPolylineIntersection",
            ensembleIdent ?? "",
            gridModelName,
            gridModelParameterName,
            gridModelDateOrInterval,
            realizationNum,
            polyline_utm_xy,
        ],
        queryFn: () =>
            apiService.grid3D.postGetPolylineIntersection(
                caseUuid,
                ensembleName,
                gridModelName ?? "",
                gridModelParameterName ?? "",
                realizationNum ?? 0,
                { polyline_utm_xy },
                gridModelDateOrInterval
            ),
        select: transformPolylineIntersection,
        staleTime: 0,
        gcTime: 0,
        enabled: !!(ensembleIdent && gridModelName && realizationNum !== null && polyline_utm_xy.length && enabled),
    });
}
