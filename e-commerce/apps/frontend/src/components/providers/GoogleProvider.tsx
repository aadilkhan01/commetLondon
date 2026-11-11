"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function GoogleProvider({ children }: { children: React.ReactNode }) {
  // Uses environment variable or falls back to a placeholder for demonstration
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "your-google-client-id";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
