import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));
import axios from "axios";
import { useCarsQuery, CARS_QUERY_KEY } from "../../hooks/useCarsQuery";

const get = axios.get as unknown as ReturnType<typeof vi.fn>;
const cars = [{ _id: "1", brand: "Subaru", model: "Outback" }];

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
};

describe("useCarsQuery", () => {
  beforeEach(() => get.mockReset());

  it("loads the cars from the API", async () => {
    get.mockResolvedValue({ data: { success: true, cars } });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCarsQuery(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(cars);
    expect(get).toHaveBeenCalledWith("/api/user/cars");
  });

  it("shares one request between components", async () => {
    get.mockResolvedValue({ data: { success: true, cars } });
    const { wrapper } = makeWrapper();
    const a = renderHook(() => useCarsQuery(), { wrapper });
    const b = renderHook(() => useCarsQuery(), { wrapper });

    await waitFor(() => expect(a.result.current.isSuccess && b.result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("serves a second mount from the cache while it is still fresh", async () => {
    get.mockResolvedValue({ data: { success: true, cars } });
    const { wrapper, client } = makeWrapper();
    const first = renderHook(() => useCarsQuery(), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    const second = renderHook(() => useCarsQuery(), { wrapper });
    expect(second.result.current.data).toEqual(cars); // instantly, no loading state
    expect(get).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(CARS_QUERY_KEY)).toEqual(cars);
  });

  it("treats success:false as an error", async () => {
    get.mockResolvedValue({ data: { success: false, message: "Nope" } });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCarsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("Nope");
  });
});
