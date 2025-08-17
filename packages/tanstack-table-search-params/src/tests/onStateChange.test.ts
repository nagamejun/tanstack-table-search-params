import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { useTableSearchParams } from "..";
import { testData } from "./testData";
import { useTestRouter } from "./testRouter";

describe("onStateChange", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  test("should sync with URL when setState is called with multiple state changes", async () => {
    const { result } = renderHook(() => {
      const router = useTestRouter();
      const searchParams = useTableSearchParams(router);
      const table = useReactTable({
        ...searchParams,
        data: testData,
        columns: [
          {
            accessorKey: "id",
            header: "ID",
          },
          {
            accessorKey: "name",
            header: "Name",
          },
        ],
        getCoreRowModel: getCoreRowModel(),
      });
      return { table, router };
    });

    // Initial state - no filters
    expect(window.location.search).toBe("");

    // Call setState to update multiple state properties at once
    await act(async () => {
      result.current.table.setState((old) => ({
        ...old,
        globalFilter: "test",
        columnFilters: [{ id: "name", value: "John" }],
      }));
      // Wait for the async navigation to complete
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify URL was updated with both parameters
    const params = new URLSearchParams(window.location.search);

    expect(params.get("globalFilter")).toBe("test");
    // columnFilters uses dot notation: id.encodedValue
    expect(params.get("columnFilters")).toBe("name.%22John%22");
  });

  test("should only update changed state properties in URL", async () => {
    // Start with existing globalFilter in URL
    window.history.replaceState({}, "", "/?globalFilter=initial");

    const { result } = renderHook(() => {
      const router = useTestRouter();
      const searchParams = useTableSearchParams(router);
      const table = useReactTable({
        ...searchParams,
        data: testData,
        columns: [
          {
            accessorKey: "id",
            header: "ID",
          },
          {
            accessorKey: "name",
            header: "Name",
          },
        ],
        getCoreRowModel: getCoreRowModel(),
      });
      return { table, router };
    });

    // Call setState but only change columnFilters
    await act(async () => {
      result.current.table.setState((old) => ({
        ...old,
        columnFilters: [{ id: "id", value: "1" }],
      }));
      // Wait for the async navigation to complete
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify globalFilter remains unchanged and columnFilters was added
    const params = new URLSearchParams(window.location.search);
    expect(params.get("globalFilter")).toBe("initial");
    // columnFilters uses dot notation: id.encodedValue
    expect(params.get("columnFilters")).toBe("id.%221%22");
  });

  test("should handle clearing filters via setState", async () => {
    // Start with existing filters in URL (use correct dot notation format)
    window.history.replaceState(
      {},
      "",
      `/?globalFilter=test&columnFilters=name.%22John%22`,
    );

    const { result } = renderHook(() => {
      const router = useTestRouter();
      const searchParams = useTableSearchParams(router);
      const table = useReactTable({
        ...searchParams,
        data: testData,
        columns: [
          {
            accessorKey: "id",
            header: "ID",
          },
          {
            accessorKey: "name",
            header: "Name",
          },
        ],
        getCoreRowModel: getCoreRowModel(),
      });
      return { table, router };
    });

    // Clear filters using setState (the original issue scenario)
    await act(async () => {
      result.current.table.setState((old) => ({
        ...old,
        globalFilter: undefined,
        columnFilters: [],
      }));
      // Wait for the async navigation to complete
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify filters were removed from URL
    const params = new URLSearchParams(window.location.search);
    expect(params.has("globalFilter")).toBe(false);
    // columnFilters should be removed when cleared
    expect(params.has("columnFilters")).toBe(false);
  });

  test("should handle pagination changes via setState", async () => {
    const { result } = renderHook(() => {
      const router = useTestRouter();
      const searchParams = useTableSearchParams(router);
      const table = useReactTable({
        ...searchParams,
        data: testData,
        columns: [
          {
            accessorKey: "id",
            header: "ID",
          },
        ],
        getCoreRowModel: getCoreRowModel(),
      });
      return { table, router };
    });

    // Update pagination via setState
    await act(async () => {
      result.current.table.setState((old) => ({
        ...old,
        pagination: {
          pageIndex: 2,
          pageSize: 20,
        },
      }));
      // Wait for the async navigation to complete
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Verify pagination parameters in URL
    const params = new URLSearchParams(window.location.search);
    // Pagination is 0-indexed in state but may be 1-indexed in URL
    expect(params.get("pageIndex")).toBe("3"); // 2 + 1 for 1-based indexing
    expect(params.get("pageSize")).toBe("20");
  });
});
