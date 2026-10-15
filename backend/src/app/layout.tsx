import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScholarFlow API",
  description: "REST API for the ScholarFlow learning platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f6f7fb",
          color: "#14161f",
        }}
      >
        {children}
      </body>
    </html>
  );
}
