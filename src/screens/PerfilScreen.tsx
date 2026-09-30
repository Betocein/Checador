// src/screens/PerfilScreen.tsx
// Foto, nombre, puesto, botón "Cerrar sesión" -> supabase.auth.signOut()
// (envuelta en lib/auth.ts como cerrarSesion). Datos reales del empleado
// logueado (tabla `empleados`), recibidos desde App.tsx.
//
// cerrarSesion() por sí sola solo cierra la sesión en Supabase; alguien
// tiene que avisarle a App.tsx para que deje de mostrar los tabs y regrese
// al Login — por eso recibe onSesionCerrada y lo llama después de que
// cerrarSesion() termine bien.

import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing } from "../theme";
import BotonChecar from "../components/BotonChecar";
import { cerrarSesion } from "../lib/auth";
import type { Empleado } from "../lib/auth";

type Props = { empleado: Empleado; onSesionCerrada: () => void };

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function PerfilScreen({ empleado, onSesionCerrada }: Props) {
  const [cerrando, setCerrando] = useState(false);

  async function onPressCerrarSesion() {
    setCerrando(true);
    try {
      await cerrarSesion();
      onSesionCerrada();
    } catch (e: any) {
      Alert.alert("No se pudo cerrar sesión", e?.message ?? "Intenta de nuevo.");
    } finally {
      setCerrando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <LinearGradient colors={colors.gradient} style={styles.photo}>
          <Text style={styles.photoText}>{iniciales(empleado.nombre_completo)}</Text>
        </LinearGradient>
        <Text style={styles.nombre}>{empleado.nombre_completo}</Text>
        <Text style={styles.puesto}>{empleado.puesto ?? "Sin puesto asignado"}</Text>
      </View>

      <View style={styles.list}>
        <Fila label="Estado" valor={empleado.activo ? "Activo" : "Inactivo"} />
        <Fila label="Rostro registrado" valor={empleado.rostro_registrado ? "Sí" : "No"} />
      </View>

      <BotonChecar
        label="Cerrar sesión"
        variant="danger"
        onPress={onPressCerrarSesion}
        loading={cerrando}
        disabled={cerrando}
      />
    </View>
  );
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.muted, fontWeight: "600", fontSize: 13 }}>{label}</Text>
      <Text style={{ fontWeight: "700", fontSize: 13, color: colors.ink }}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  hero: { alignItems: "center", paddingVertical: 20 },
  photo: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  photoText: { color: "#fff", fontSize: 24, fontWeight: "700" },
  nombre: { fontSize: 17, fontWeight: "800", color: colors.ink },
  puesto: { fontSize: 12.5, color: colors.muted },
  list: { gap: 10, marginBottom: 20 },
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});