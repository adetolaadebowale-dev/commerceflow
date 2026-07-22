import { forwardRef, type ComponentRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

import { useTheme } from "@/providers/theme-provider";

interface PrimaryButtonProps extends Omit<PressableProps, "children" | "style"> {
  readonly label: string;
  readonly loading?: boolean;
  readonly variant?: "primary" | "secondary" | "ghost";
}

export const PrimaryButton = forwardRef<
  ComponentRef<typeof Pressable>,
  PrimaryButtonProps
>(function PrimaryButton(
  {
    label,
    loading = false,
    disabled,
    variant = "primary",
    ...pressableProps
  },
  ref,
) {
  const { colors, spacing, radii, typography } = useTheme();
  const isDisabled = Boolean(disabled || loading);

  const backgroundColor =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.surface
        : "transparent";

  const textColor =
    variant === "primary" ? colors.textInverse : colors.primary;

  const borderColor =
    variant === "secondary" ? colors.border : "transparent";

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight: 48,
          borderRadius: radii.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          backgroundColor,
          borderColor,
          opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
        },
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[typography.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
