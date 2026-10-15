export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://scholarflow-backend.vercel.app/api"
).replace(/\/$/, "");
