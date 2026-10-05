import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GapMap — Local Market Opportunity Scanner",
    short_name: "GapMap",
    description:
      "Discover untapped commercial opportunities and market gaps before opening a business.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/icon.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
