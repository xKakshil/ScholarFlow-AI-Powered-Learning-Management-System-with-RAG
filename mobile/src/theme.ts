export const colors = {
  bg: "#F6F7FB",
  surface: "#FFFFFF",
  text: "#14161F",
  muted: "#6B7080",
  border: "#E4E6EE",
  primary: "#4F46E5",
  primaryDark: "#3730A3",
  primarySoft: "#EEF0FF",
  success: "#0F9D58",
  successSoft: "#E6F6EE",
  danger: "#D93025",
  dangerSoft: "#FDECEA",
  warningSoft: "#FFF6E0",
  warning: "#8A5A00",
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22 };
export const space = (n: number) => n * 4;

export const type = {
  h1: { fontSize: 28, fontWeight: "800" as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: "700" as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: "700" as const, color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  small: { fontSize: 13, color: colors.muted },
};
