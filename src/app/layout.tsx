import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PreOne — Preschool Operating System",
  description:
    "One beautiful operating system for every preschool. Admissions, students, attendance, fees and parent communication — all in one place.",
  keywords: ["PreOne", "preschool", "ERP", "admissions", "attendance", "fees"],
  authors: [{ name: "PreOne" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F6FC" },
    { media: "(prefers-color-scheme: dark)", color: "#090D24" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("preone-theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
