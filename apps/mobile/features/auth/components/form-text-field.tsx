import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { useTheme } from "@/providers/theme-provider";

export interface FormTextFieldProps extends Omit<TextInputProps, "style"> {
  readonly label: string;
  readonly error?: string;
}

export const FormTextField = forwardRef<TextInput, FormTextFieldProps>(
  function FormTextField(
    { label, error, editable = true, ...inputProps },
    ref,
  ) {
    const { colors, spacing, radii, typography } = useTheme();
    const hasError = Boolean(error);

    return (
      <View style={[styles.root, { gap: spacing.xs }]}>
        <Text style={[typography.label, { color: colors.text }]}>{label}</Text>
        <TextInput
          ref={ref}
          accessible
          accessibilityLabel={label}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            typography.body,
            {
              minHeight: 48,
              borderRadius: radii.md,
              borderColor: hasError ? colors.error : colors.border,
              backgroundColor: colors.surfaceMuted,
              color: colors.text,
              paddingHorizontal: spacing.md,
              opacity: editable ? 1 : 0.6,
            },
          ]}
          {...inputProps}
        />
        {hasError ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[typography.caption, { color: colors.error }]}
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  input: {
    borderWidth: 1,
    width: "100%",
  },
});
