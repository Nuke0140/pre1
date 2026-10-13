import type { Metadata, Viewport } from "next";
import PreHydration from "@/components/PreHydration";
import "./globals.css";

export const metadata: Metadata = {
  title: "PreOne — Preschool Operating System",
  description:
    "One beautiful operating system for every preschool. Admissions, students, attendance, fees and parent communication — all in one place.",
  keywords: ["PreOne", "preschool", "ERP", "admissions", "attendance", "fees"],
  authors: [{ name: "PreOne" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/preone-mark.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F19" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#F7F8FC" id="app-theme-color-meta" />
        {/* Critical Font Preloads (Poppins 600 headings & Nunito 400 body) */}
        <link
          rel="preload"
          href="/fonts/poppins-latin-600-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/poppins-devanagari-600-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/nunito-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/preone-mark.svg"
          as="image"
          type="image/svg+xml"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
  try {
    var stored = localStorage.getItem('preone_theme') || localStorage.getItem('preone-theme');
    var isDark = false;
    if (stored === 'dark') {
      isDark = true;
    } else if (stored === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    var theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    var meta = document.getElementById('app-theme-color-meta');
    if (meta) {
      meta.setAttribute('content', isDark ? '#0B0F19' : '#F7F8FC');
    }
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body>
        <PreHydration />
        {children}
      </body>
    </html>
  );
}
