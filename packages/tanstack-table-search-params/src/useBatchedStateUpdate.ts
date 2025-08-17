import { useCallback } from "react";
import type { Options, State } from ".";
import { convertQueryToURLSearchParams } from "./convertQueryToURLSearchParams";
import { encodeColumnFilters, encodeColumnOrder, encodeGlobalFilter, encodePagination, encodeRowSelection, encodeSorting } from "./encoder-decoder";
import type { Query, Router } from "./types";

type Props = {
  router: Router;
  options?: Options;
};

export const useBatchedStateUpdate = ({ router, options }: Props) => {
  return useCallback(
    async (oldState: State, newState: State) => {
      const query: Query = { ...router.query };

      // Remove old state parameters
      const globalFilterParam =
        options?.paramNames?.globalFilter || "globalFilter";
      const sortingParam = options?.paramNames?.sorting || "sorting";
      const columnFiltersParam =
        options?.paramNames?.columnFilters || "columnFilters";
      const columnOrderParam =
        options?.paramNames?.columnOrder || "columnOrder";
      const rowSelectionParam =
        options?.paramNames?.rowSelection || "rowSelection";

      // Handle pagination params (can be multiple)
      const paginationParams = options?.paramNames?.pagination || {
        pageIndex: "pageIndex",
        pageSize: "pageSize",
      };
      const pageIndexParam =
        typeof paginationParams === "object"
          ? paginationParams.pageIndex
          : "pageIndex";
      const pageSizeParam =
        typeof paginationParams === "object"
          ? paginationParams.pageSize
          : "pageSize";

      // Build new query with all state changes
      const updates: Query = {};

      // GlobalFilter
      if (newState.globalFilter !== oldState.globalFilter) {
        if (options?.encoders?.globalFilter) {
          Object.assign(
            updates,
            options.encoders.globalFilter(newState.globalFilter),
          );
        } else {
          const encoded = encodeGlobalFilter(newState.globalFilter, {
            defaultValue: options?.defaultValues?.globalFilter,
          });
          if (encoded !== undefined) {
            updates[globalFilterParam as string] = encoded;
          } else {
            delete query[globalFilterParam as string];
          }
        }
      }

      // Sorting
      if (
        JSON.stringify(newState.sorting) !== JSON.stringify(oldState.sorting)
      ) {
        if (options?.encoders?.sorting) {
          Object.assign(updates, options.encoders.sorting(newState.sorting));
        } else {
          const encoded = encodeSorting(newState.sorting, {
            defaultValue: options?.defaultValues?.sorting,
          });
          if (encoded !== undefined) {
            updates[sortingParam as string] = encoded;
          } else {
            delete query[sortingParam as string];
          }
        }
      }

      // Pagination
      if (
        newState.pagination?.pageIndex !== oldState.pagination?.pageIndex ||
        newState.pagination?.pageSize !== oldState.pagination?.pageSize
      ) {
        if (options?.encoders?.pagination) {
          Object.assign(
            updates,
            options.encoders.pagination(newState.pagination),
          );
        } else {
          const encoded = encodePagination(newState.pagination, {
            defaultValue: options?.defaultValues?.pagination,
          });
          if (encoded.pageIndex !== undefined) {
            updates[pageIndexParam] = encoded.pageIndex;
          } else {
            delete query[pageIndexParam];
          }
          if (encoded.pageSize !== undefined) {
            updates[pageSizeParam] = encoded.pageSize;
          } else {
            delete query[pageSizeParam];
          }
        }
      }

      // ColumnFilters
      if (
        JSON.stringify(newState.columnFilters) !==
        JSON.stringify(oldState.columnFilters)
      ) {
        if (options?.encoders?.columnFilters) {
          Object.assign(
            updates,
            options.encoders.columnFilters(newState.columnFilters),
          );
        } else {
          const encoded = encodeColumnFilters(newState.columnFilters, {
            defaultValue: options?.defaultValues?.columnFilters,
          });
          if (encoded !== undefined) {
            updates[columnFiltersParam as string] = encoded;
          } else {
            delete query[columnFiltersParam as string];
          }
        }
      }

      // ColumnOrder
      if (
        JSON.stringify(newState.columnOrder) !==
        JSON.stringify(oldState.columnOrder)
      ) {
        if (options?.encoders?.columnOrder) {
          Object.assign(
            updates,
            options.encoders.columnOrder(newState.columnOrder),
          );
        } else {
          const encoded = encodeColumnOrder(newState.columnOrder, {
            defaultValue: options?.defaultValues?.columnOrder,
          });
          if (encoded !== undefined) {
            updates[columnOrderParam as string] = encoded;
          } else {
            delete query[columnOrderParam as string];
          }
        }
      }

      // RowSelection
      if (
        JSON.stringify(newState.rowSelection) !==
        JSON.stringify(oldState.rowSelection)
      ) {
        if (options?.encoders?.rowSelection) {
          Object.assign(
            updates,
            options.encoders.rowSelection(newState.rowSelection),
          );
        } else {
          const encoded = encodeRowSelection(newState.rowSelection, {
            defaultValue: options?.defaultValues?.rowSelection,
          });
          if (encoded !== undefined) {
            updates[rowSelectionParam as string] = encoded;
          } else {
            delete query[rowSelectionParam as string];
          }
        }
      }

      // Merge updates with existing query
      const finalQuery = { ...query, ...updates };

      // Remove undefined values
      const cleanQuery = Object.fromEntries(
        Object.entries(finalQuery).filter(([, value]) => value !== undefined),
      );

      // Navigate with all updates at once
      const searchParams = new URLSearchParams(
        convertQueryToURLSearchParams(cleanQuery),
      ).toString();

      await router.navigate(
        `${router.pathname}${searchParams ? `?${searchParams}` : ""}`,
      );
    },
    [router, options],
  );
};
