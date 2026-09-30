// src/components/BotonChecar.tsx
// Botón reutilizable de la app. Variantes: "primary" (gradiente morado),
// "outline" y "danger" (texto morado, sin relleno — usado en Cerrar sesión).

import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, typography } from "../theme";

type Variant = "primary" | "outline" | "danger";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function BotonChecar({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: Props) {
  const isDisabled = disabled || loading;

  if (variant === "primary") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[styles.wrapper, style, isDisabled && styles.disabled]}
      >
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[typography.button, styles.textOnGradient]}>
              {label}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === "danger") {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.wrapper, styles.dangerGhost, style]}
      >
        <Text style={[typography.button, { color: colors.danger }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.wrapper, styles.outline, style, isDisabled && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <Text style={[typography.button, { color: colors.ink }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderRadius: radius.pill,
    overflow: "hidden",
    marginTop: 10,
  },
  gradientFill: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  textOnGradient: { color: "#fff" },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  dangerGhost: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  disabled: { opacity: 0.6 },
});
