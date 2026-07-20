export const lightColors = {
  background: "#F6F4F1",
  surface: "#FFFFFF",
  surfaceMuted: "#EFECE7",
  primary: "#1F3A5F",
  primaryMuted: "#2E4F7A",
  accent: "#C47B3A",
  text: "#1A2233",
  textSecondary: "#5C6678",
  textInverse: "#FFFFFF",
  border: "#D9D3CB",
  borderFocus: "#1F3A5F",
  error: "#C94C4C",
  errorSurface: "#FCEFEF",
  success: "#2F6F4E",
  overlay: "rgba(26, 34, 51, 0.45)",
} as const satisfies Record<string, string>;

export const darkColors = {
  background: "#12161F",
  surface: "#1B2230",
  surfaceMuted: "#242C3B",
  primary: "#7FA3D4",
  primaryMuted: "#5B7EAD",
  accent: "#D4A15A",
  text: "#F3F5F8",
  textSecondary: "#A7B0C0",
  textInverse: "#12161F",
  border: "#343E50",
  borderFocus: "#7FA3D4",
  error: "#E07A7A",
  errorSurface: "#3A2424",
  success: "#6FBF94",
  overlay: "rgba(0, 0, 0, 0.55)",
} as const satisfies Record<string, string>;

export type ThemeColors = { readonly [K in keyof typeof lightColors]: string };
