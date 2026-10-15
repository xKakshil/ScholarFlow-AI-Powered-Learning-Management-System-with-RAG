export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "https://scholarflow-backend.vercel.app/api";

export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || "https://scholarflow-frontend-phi.vercel.app";
