export const colors = {
  background: "#F6F4F1",
  surface: "#FFFFFF",
  surfaceMuted: "#EFECE7",
  primary: "#1F3A5F",
  primaryDark: "#162C49",
  accent: "#D4A15A",
  accentSoft: "#F3E6D4",
  textPrimary: "#1A2233",
  textSecondary: "#5C6678",
  textInverse: "#FFFFFF",
  border: "#D9D3CB",
  borderFocus: "#1F3A5F",
  error: "#C94C4C",
  errorSurface: "#FCEFEF",
  shadow: "#1A2233",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
};
