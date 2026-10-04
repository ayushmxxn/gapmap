"use client";

import { useMutation } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { AREA_PRESETS, CATEGORIES } from "@/lib/categories";
import { postScan, scanUrl } from "@/lib/scan-client";
import { useAppStore } from "@/store/app";
import { Button } from "@/components/ui/button";

export function ScanForm() {
  const {
    lat,
    lng,
    areaLabel,
    categoryId,
    setArea,
    setCategoryId,
    setStatus,
    setResult,
    setError,
  } = useAppStore();

  const mutation = useMutation({
    mutationFn: postScan,
    onMutate: () => {
      setStatus("loading");
      setError(null);
      setResult(null);
    },
    onSuccess: (data) => {
      setResult(data);
      setStatus("success");
      window.history.replaceState(
        null,
        "",
        scanUrl({ lat, lng, categoryId, areaLabel }),
      );
      document
        .getElementById("gap-result")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    onError: (err) => {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Scan failed.");
    },
  });

  return (
    <form
      className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate({ lat, lng, categoryId, areaLabel });
      }}
    >
      <label className="sr-only" htmlFor="gap-area">
        Area
      </label>
      <select
        id="gap-area"
        className="h-9 min-w-0 max-w-44 truncate rounded-md border border-input bg-background px-2 text-sm"
        value={areaLabel}
        onChange={(e) => {
          const preset = AREA_PRESETS.find((p) => p.label === e.target.value);
          if (preset) setArea(preset.lat, preset.lng, preset.label);
          else setArea(lat, lng, e.target.value);
        }}
      >
        {AREA_PRESETS.map((p) => (
          <option key={p.id} value={p.label}>
            {p.label}
          </option>
        ))}
        {!AREA_PRESETS.some((p) => p.label === areaLabel) && (
          <option value={areaLabel}>{areaLabel}</option>
        )}
      </select>

      <label className="sr-only" htmlFor="gap-category">
        Category
      </label>
      <select
        id="gap-category"
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      <Button type="submit" size="sm" disabled={mutation.isPending}>
        <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={2} />
        {mutation.isPending ? "Scanning…" : "Scan"}
      </Button>
    </form>
  );
}
