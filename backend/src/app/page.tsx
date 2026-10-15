export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <h1 style={{ fontSize: 32, margin: "0 0 8px" }}>ScholarFlow API</h1>
        <p style={{ color: "#6b7080", lineHeight: 1.6, margin: 0 }}>
          Backend for the ScholarFlow web and mobile apps. Service status is available at{" "}
          <a href="/api/health" style={{ color: "#4f46e5" }}>
            /api/health
          </a>
          .
        </p>
      </div>
    </main>
  );
}
