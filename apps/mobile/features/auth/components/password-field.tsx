import { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { useTheme } from "@/providers/theme-provider";

export interface PasswordFieldProps
  extends Omit<TextInputProps, "style" | "secureTextEntry"> {
  readonly label: string;
  readonly error?: string;
}

export const PasswordField = forwardRef<TextInput, PasswordFieldProps>(
  function PasswordField(
    { label, error, editable = true, ...inputProps },
    ref,
  ) {
    const { colors, spacing, radii, typography } = useTheme();
    const [visible, setVisible] = useState(false);
    const hasError = Boolean(error);

    return (
      <View style={[styles.root, { gap: spacing.xs }]}>
        <Text style={[typography.label, { color: colors.text }]}>{label}</Text>
        <View
          style={[
            styles.row,
            {
              minHeight: 48,
              borderRadius: radii.md,
              borderColor: hasError ? colors.error : colors.border,
              backgroundColor: colors.surfaceMuted,
              opacity: editable ? 1 : 0.6,
            },
          ]}
        >
          <TextInput
            ref={ref}
            accessible
            accessibilityLabel={label}
            accessibilityState={{ disabled: !editable }}
            editable={editable}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              typography.body,
              {
                color: colors.text,
                paddingHorizontal: spacing.md,
              },
            ]}
            {...inputProps}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            hitSlop={8}
            disabled={!editable}
            onPress={() => setVisible((current) => !current)}
            style={[
              styles.toggle,
              {
                minWidth: 48,
                minHeight: 48,
                paddingHorizontal: spacing.sm,
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.primary }]}>
              {visible ? "Hide" : "Show"}
            </Text>
          </Pressable>
        </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    width: "100%",
  },
  input: {
    flex: 1,
    minHeight: 48,
  },
  toggle: {
    alignItems: "center",
    justifyContent: "center",
  },
});
