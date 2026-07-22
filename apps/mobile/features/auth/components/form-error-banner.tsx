import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/providers/theme-provider";

interface FormErrorBannerProps {
  readonly message: string;
}

export function FormErrorBanner({ message }: FormErrorBannerProps) {
  const { colors, spacing, radii, typography } = useTheme();

  return (
    <View
      accessibilityLiveRegion="assertive"
      style={[
        styles.banner,
        {
          backgroundColor: colors.errorSurface,
          borderColor: colors.error,
          borderRadius: radii.md,
          padding: spacing.md,
        },
      ]}
    >
      <Text style={[typography.caption, { color: colors.error }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    borderWidth: 1,
  },
});
