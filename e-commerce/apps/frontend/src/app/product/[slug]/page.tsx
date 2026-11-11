import { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";
import type { Product } from "@/types";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://192.168.6.53"}/api/v1/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "GoCarry";

  return {
    title: `${product.name} | ${appName}`,
    description: product.description,
    openGraph: {
      title: `${product.name} | ${appName}`,
      description: product.description,
      images: [
        {
          url: product.images?.[0] || "",
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | ${appName}`,
      description: product.description,
      images: [product.images?.[0] || ""],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.slug);

  if (!product) {
    return (
      <div className="container-main" style={{ padding: "120px 0", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", letterSpacing: "0.1em", marginBottom: "16px" }}>PRODUCT NOT FOUND</h1>
        <p>This product may have been removed or does not exist.</p>
      </div>
    );
  }

  return <ProductDetailClient initialProduct={product} />;
}
