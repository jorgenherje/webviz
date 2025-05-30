from typing import List, Tuple, Optional

import pyarrow as pa
import pyarrow.compute as pc
import numpy as np

from primary.services.service_exceptions import InvalidDataError, Service


def validate_summary_vector_table_pa(
    vector_table: pa.Table, vector_name: str, service: Service = Service.GENERAL
) -> None:
    """
    Check if the pyarrow vector table is valid.

    Expect the pyarrow single vector table to only contain the following columns: DATE, REAL, vector_name.

    Raises InvalidDataError if the table does not contain the expected columns.
    """
    expected_columns = {"DATE", "REAL", vector_name}
    actual_columns = set(vector_table.column_names)
    if expected_columns != actual_columns:
        unexpected_columns = actual_columns - expected_columns
        raise InvalidDataError(f"Unexpected columns in table {unexpected_columns}", service)

    # Validate table column types
    if vector_table.field("DATE").type != pa.timestamp("ms"):
        raise InvalidDataError(
            f'DATE column must be of type timestamp(ms), but got {vector_table.field("DATE").type}', service
        )
    if vector_table.field("REAL").type != pa.int16():
        raise InvalidDataError("REAL column must be of type int16", service)
    if vector_table.field(vector_name).type != pa.float32():
        raise InvalidDataError(f"{vector_name} column must be of type float32", service)


def sort_table_on_real_then_date(table: pa.Table) -> pa.Table:
    return table.sort_by([("REAL", "ascending"), ("DATE", "ascending")])


def sort_table_on_date(table: pa.Table) -> pa.Table:
    return table.sort_by("DATE")


def is_date_column_monotonically_increasing(table: pa.Table) -> bool:
    dates_np = table.column("DATE").to_numpy()
    if not np.all(np.diff(dates_np) > np.timedelta64(0)):
        return False

    return True


def find_first_non_increasing_date_pair(table: pa.Table) -> Tuple[Optional[np.datetime64], Optional[np.datetime64]]:
    dates_np = table.column("DATE").to_numpy()
    offending_indices = np.asarray(np.diff(dates_np) <= np.timedelta64(0)).nonzero()[0]
    if len(offending_indices) == 0:
        return (None, None)

    return (dates_np[offending_indices[0]], dates_np[offending_indices[0] + 1])


def detect_missing_realizations(table_with_real_column: pa.Table, required_reals_arr: pa.IntegerArray) -> List[int]:
    unique_reals_in_table = table_with_real_column["REAL"].unique()

    reals_present_mask = pc.is_in(required_reals_arr, value_set=unique_reals_in_table)
    reals_not_present_mask = pc.invert(reals_present_mask)
    missing_realizations_list = required_reals_arr.filter(reals_not_present_mask).to_pylist()
    return missing_realizations_list


def create_float_downcasting_schema(schema: pa.Schema) -> pa.Schema:
    dt_float64 = pa.float64()
    dt_float32 = pa.float32()
    types = schema.types
    for idx, typ in enumerate(types):
        if typ == dt_float64:
            types[idx] = dt_float32

    field_list = zip(schema.names, types)
    return pa.schema(field_list)


def set_date_column_type_to_timestamp_ms(schema: pa.Schema) -> pa.Schema:
    dt_timestamp_ms = pa.timestamp("ms")

    indexof_date_field = schema.get_field_index("DATE")

    types = schema.types
    types[indexof_date_field] = dt_timestamp_ms

    field_list = zip(schema.names, types)
    return pa.schema(field_list)


def set_real_column_type_to_int16(schema: pa.Schema) -> pa.Schema:
    dt_int16 = pa.int16()

    indexof_real_field = schema.get_field_index("REAL")
    types = schema.types
    types[indexof_real_field] = dt_int16

    field_list = zip(schema.names, types)
    return pa.schema(field_list)
