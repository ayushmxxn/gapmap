"use client";

import { useMutation } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { postScan, scanUrl } from "@/lib/scan-client";
import { useAppStore } from "@/store/app";
import { Button } from "@/components/ui/button";
import { LocationSearch } from "@/components/location-search";
import { BusinessSearch } from "@/components/business-search";

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
      <LocationSearch
        value={areaLabel}
        onSelect={(newLat, newLng, label) => setArea(newLat, newLng, label)}
        className="max-w-56 flex-1 sm:max-w-64"
      />

      <BusinessSearch
        value={categoryId}
        onSelect={(cat) => setCategoryId(cat)}
        className="max-w-44 flex-1 sm:max-w-52"
      />

      <Button type="submit" size="sm" disabled={mutation.isPending}>
        <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={2} />
        {mutation.isPending ? "Scanning…" : "Scan"}
      </Button>
    </form>
  );
}
