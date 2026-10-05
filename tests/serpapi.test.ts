import { beforeEach, describe, expect, it, vi } from "vitest";

const getJsonMock = vi.fn();

vi.mock("serpapi", () => ({
  getJson: (...args: unknown[]) => getJsonMock(...args),
}));

vi.mock("@/lib/env", () => ({
  serverEnv: {
    SERPAPI_KEY: "test_dummy_key_12345",
  },
  clientEnv: {
    NEXT_PUBLIC_USE_MOCK: false,
  },
}));

import { fetchMapsPlaces } from "@/lib/serpapi";

describe("SerpApi Client: fetchMapsPlaces Country Code (gl)", () => {
  beforeEach(() => {
    getJsonMock.mockReset();
    getJsonMock.mockResolvedValue({
      local_results: [
        {
          position: 1,
          title: "Test Cafe",
          gps_coordinates: { latitude: 28.6139, longitude: 77.209 },
        },
      ],
    });
  });

  it('defaults to gl="in" when no country code is specified', async () => {
    await fetchMapsPlaces({ q: "cafes in delhi" });

    expect(getJsonMock).toHaveBeenCalledTimes(1);
    const passedParams = getJsonMock.mock.calls[0][0];
    expect(passedParams.engine).toBe("google_maps");
    expect(passedParams.gl).toBe("in");
    expect(passedParams.hl).toBe("en");
  });

  it('uses explicitly provided gl country code when supplied', async () => {
    await fetchMapsPlaces({ q: "cafes in tokyo", gl: "jp" });

    expect(getJsonMock).toHaveBeenCalledTimes(1);
    const passedParams = getJsonMock.mock.calls[0][0];
    expect(passedParams.engine).toBe("google_maps");
    expect(passedParams.gl).toBe("jp");
  });

  it('falls back to "in" when gl is empty or only whitespace', async () => {
    await fetchMapsPlaces({ q: "cafes in gwalior", gl: "   " });

    expect(getJsonMock).toHaveBeenCalledTimes(1);
    const passedParams = getJsonMock.mock.calls[0][0];
    expect(passedParams.gl).toBe("in");
  });
});
