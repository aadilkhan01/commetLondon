import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import CartDrawer from "@/components/cart/CartDrawer";
import MobileMenu from "@/components/layout/MobileMenu";
import SearchModal from "@/components/layout/SearchModal";
import GoogleProvider from "@/components/providers/GoogleProvider";

export const metadata: Metadata = {
  title: "GoCarry — Premium Bags, Luggage & Travel Gear",
  description: "Discover premium bags, luggage, backpacks, and travel accessories. Engineered for modern travelers. Free shipping on orders over $100.",
  keywords: "bags, luggage, backpacks, travel, trolley, cabin bags, laptop backpack",
  openGraph: {
    title: "GoCarry — Premium Bags, Luggage & Travel Gear",
    description: "Discover premium bags, luggage, backpacks, and travel accessories.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const savedTheme = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          })();
        ` }} />
      </head>
      <body>
        <GoogleProvider>
          <AnnouncementBar />
          <Header />
          <main style={{ minHeight: "calc(100vh - 64px)" }}>
            {children}
          </main>
          <Footer />
          <MobileMenu />
          <SearchModal />
        </GoogleProvider>
      </body>
    </html>
  );
}
