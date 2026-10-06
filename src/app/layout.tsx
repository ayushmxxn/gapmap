import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";
import { Providers } from "@/components/providers";
import { siteUrl } from "@/lib/env";

const title = "GapMap — Local Market Opportunity & Business Feasibility Scanner";
const description =
  "Discover untapped commercial opportunities before opening a business. GapMap scans local competition, customer sentiment, and demand gaps across any neighborhood.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | GapMap",
  },
  description,
  applicationName: "GapMap",
  keywords: [
    "market opportunity analysis",
    "business feasibility scanner",
    "competitor gap analysis",
    "local business intelligence",
    "retail location analysis",
    "market demand scanner",
    "commercial opportunity score",
  ],
  authors: [{ name: "GapMap" }],
  creator: "GapMap",
  publisher: "GapMap",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "GapMap",
    title,
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GapMap — Local Market Opportunity & Business Feasibility Scanner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  category: "business",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}#webapp`,
      name: "GapMap",
      url: siteUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Local Competitor Density Mapping",
        "Customer Review Sentiment Analysis",
        "Real-Time Search Demand Trends",
        "Commercial Opportunity Scoring",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: "GapMap",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
