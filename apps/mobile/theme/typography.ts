export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600" as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500" as const,
  },
} as const;

export type TypographyToken = keyof typeof typography;
