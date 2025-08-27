export const metadata = {
  title: "Foundation Funding — Interactive Checklist",
  description: "A lightweight web app for tracking foundation relationship tasks.",
};

import "./globals.css";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
