// src/screens/LoginScreen.tsx
// Correo + contraseña -> supabase.auth.signInWithPassword() (envuelta en
// lib/auth.ts como iniciarSesion). Si es exitoso, App.tsx decide si
// navega a "Registrar mi rostro" o directo a "Checador".

import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import BotonChecar from "../components/BotonChecar";
import { iniciarSesion } from "../lib/auth";

type Props = { onLoginExitoso: () => void };

export default function LoginScreen({ onLoginExitoso }: Props) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onPressEntrar() {
    if (!correo || !contrasena) {
      Alert.alert("Faltan datos", "Ingresa tu correo y tu contraseña.");
      return;
    }
    setCargando(true);
    try {
      await iniciarSesion(correo.trim(), contrasena);
      onLoginExitoso();
    } catch (e: any) {
      Alert.alert("No se pudo iniciar sesión", e?.message ?? "Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient colors={colors.gradient} style={styles.mark}>
        <Ionicons name="finger-print-outline" size={24} color="#fff" />
      </LinearGradient>

      <Text style={typography.title}>Bienvenido</Text>
      <Text style={[typography.subtitle, { marginBottom: spacing.xl }]}>
        Inicia sesión con tu cuenta de la empresa para registrar tu entrada y
        salida.
      </Text>

      <View style={styles.field}>
        <Text style={typography.label}>Correo</Text>
        <TextInput
          style={styles.input}
          placeholder="nombre@empresa.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={correo}
          onChangeText={setCorreo}
        />
      </View>

      <View style={styles.field}>
        <Text style={typography.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={contrasena}
          onChangeText={setContrasena}
        />
      </View>

      <BotonChecar label="Entrar" onPress={onPressEntrar} loading={cargando} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  mark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  field: { marginBottom: spacing.md },
  input: {
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 14,
    color: colors.ink,
    marginTop: 6,
  },
});
