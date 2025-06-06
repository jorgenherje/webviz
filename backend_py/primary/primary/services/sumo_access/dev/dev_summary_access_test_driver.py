import sys
from typing import List
import logging
import asyncio

import pyarrow as pa

from fmu.sumo.explorer.explorer import SumoClient

from primary.services.summary_vector_statistics import compute_vector_statistics_table, compute_vector_statistics
from ..summary_access import SummaryAccess, RealizationVector, Frequency
from ..sumo_inspector import SumoInspector
from ..case_inspector import CaseInspector


async def test_summary_access(summary_access: SummaryAccess) -> None:
    vector_info_list = await summary_access.get_available_vectors_async()
    if len(vector_info_list) == 0:
        print("\n\nNo summary vectors found, giving up!\n")
        return

    # print("\n\nVECTOR_INFO\n-----------------------")
    # for vector_info in vector_info_list:
    #     print(vector_info)

    # # Test getting a number of vectors for a single realization
    # print("\n\nSINGLE_REAL MONTHLY\n-----------------------")
    # all_vector_names = [vector_info.name for vector_info in vector_info_list]
    # #vector_names_to_get = ["FWPT", "FOPR", "FOPT"]
    # vector_names_to_get = all_vector_names[:10]
    # vector_table, vector_meta_list = await summary_access.get_single_real_vectors_table_async(
    #     vector_names=vector_names_to_get, resampling_frequency=Frequency.MONTHLY, realization=1
    # )
    # print(vector_table.shape)
    # print(vector_table)
    # print(vector_meta_list)

    print("\n\nTABLE RAW\n-----------------------")
    vector_table, _vector_meta = await summary_access.get_vector_table_async(
        vector_name="FOPT", resampling_frequency=None, realizations=None
    )
    print(vector_table.shape)

    print("\n\nTABLE DAILY\n-----------------------")
    vector_table, _vector_meta = await summary_access.get_vector_table_async(
        vector_name="FOPT", resampling_frequency=Frequency.DAILY, realizations=None
    )
    print(vector_table.shape)

    print("\n\nTABLE YEARLY\n-----------------------")
    vector_table, _vector_meta = await summary_access.get_vector_table_async(
        vector_name="FOPT", resampling_frequency=Frequency.YEARLY, realizations=None
    )
    print(vector_table)
    print(vector_table.shape)

    print("\n\nTABLE YEARLY - only real 0\n-----------------------")
    vector_table, _vector_meta = await summary_access.get_vector_table_async(
        vector_name="FOPT", resampling_frequency=Frequency.YEARLY, realizations=[0, 1]
    )
    vector_table = vector_table.filter(pa.compute.equal(vector_table["REAL"], 0))
    print(vector_table)
    print(vector_table.shape)

    print("\n\nYEARLY\n-----------------------")
    vector_arr: List[RealizationVector] = await summary_access.get_vector_async(
        "FOPT", resampling_frequency=Frequency.YEARLY, realizations=None
    )
    print(f"{len(vector_arr)=}")
    print(vector_arr[0])

    #
    # Fetch table to use when computing statistics first
    vector_table, _vector_meta = await summary_access.get_vector_table_async(
        vector_name="FOPT", resampling_frequency=Frequency.YEARLY, realizations=None
    )
    print("\n\nSTATS table\n-----------------------")
    stat_table = compute_vector_statistics_table(vector_table, "FOPT", None)
    if not stat_table:
        raise RuntimeError("No STATS table")
    print(stat_table)
    print(stat_table.schema)

    print("\n\nSTATS\n-----------------------")
    vec_stats = compute_vector_statistics(vector_table, "FOPT", None)
    print(vec_stats)


async def main() -> None:
    print("\n\n")
    print("## Running dev_summary_access_test_driver")
    print("## =================================================")

    logging.basicConfig(
        level=logging.WARNING,
        format="%(asctime)s %(levelname)-3s [%(name)s]: %(message)s",
    )
    logging.getLogger("").setLevel(level=logging.DEBUG)
    logging.getLogger("httpx").setLevel(level=logging.WARNING)
    logging.getLogger("httpcore").setLevel(level=logging.INFO)
    logging.getLogger("msal").setLevel(level=logging.INFO)
    logging.getLogger("urllib3").setLevel(level=logging.INFO)

    logging.getLogger("src.services.sumo_access").setLevel(level=logging.DEBUG)

    dummy_sumo_client = SumoClient(env="prod", interactive=False, verbosity="DEBUG")
    access_token = dummy_sumo_client.auth.get_token()

    sumo_inspector = SumoInspector(access_token=access_token)
    # case_list = await sumo_inspector.get_cases(field_identifier="DROGON")
    # case_list = await sumo_inspector.get_cases(field_identifier="JOHAN SVERDRUP")
    case_list = await sumo_inspector.get_cases_async(field_identifier="SNORRE")
    # for case_info in case_list:
    #     print(case_info)

    sumo_case_id = "11167ec3-41f7-452c-8a08-38466df6bb97"
    sumo_case_id = "e2c7ca0a-8087-4e78-a0f5-121632af3d7b"  # Sverdrup, no vectors
    sumo_case_id = "9c7ac93c-1bc2-4fdc-a827-787a68f19a21"  # Snorre
    sumo_case_name = None
    for case_info in case_list:
        if case_info.uuid == sumo_case_id:
            sumo_case_name = case_info.name

    if not sumo_case_name:
        print("The sumo case id was not found")
        sys.exit(1)

    case_inspector = CaseInspector.from_case_uuid(access_token, sumo_case_id)
    iteration_list = await case_inspector.get_iterations_async()
    print("\n\n")
    for iteration_info in iteration_list:
        print(iteration_info)

    iteration_name = iteration_list[0].name
    summary_access = SummaryAccess.from_iteration_name(
        access_token=access_token, case_uuid=sumo_case_id, iteration_name=iteration_name
    )
    await test_summary_access(summary_access)


# Running:
#   python -m src.services.sumo_access.dev.dev_summary_access_test_driver
# -------------------------------------------------------------------------
if __name__ == "__main__":
    asyncio.run(main())
