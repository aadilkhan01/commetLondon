import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoCarry ADMIN — Backoffice Control Panel",
  description: "Enterprise administration portal for inventory, catalog, and orders management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
