// src/screens/RegistrarRostroScreen.tsx
// Solo la primera vez. Cámara frontal + botón "Tomar foto" -> llama
// registrarRostro(fotoUri), que sube la foto al microservicio facial y
// guarda el descriptor en rostros_referencia. Al terminar, navega a
// Checador.

import React, { useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { colors, radius, spacing, typography } from "../theme";
import BotonChecar from "../components/BotonChecar";
import EsperaVerificacion from "../components/EsperaVerificacion";
import { registrarRostro } from "../lib/rostro";

type Props = { onRegistroExitoso: () => void };

export default function RegistrarRostroScreen({ onRegistroExitoso }: Props) {
  const [permiso, solicitarPermiso] = useCameraPermissions();
  const [cargando, setCargando] = useState(false);
  const camaraRef = useRef<CameraView>(null);

  if (!permiso) return <View style={styles.container} />;

  if (!permiso.granted) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <Text style={typography.subtitle}>
          Necesitamos permiso de tu cámara frontal para registrar tu rostro.
        </Text>
        <BotonChecar label="Dar permiso" onPress={solicitarPermiso} />
      </View>
    );
  }

  async function onPressTomarFoto() {
    if (!camaraRef.current) return;
    setCargando(true);
    try {
      const foto = await camaraRef.current.takePictureAsync({ quality: 0.7 });
      if (!foto) throw new Error("No se pudo tomar la foto, intenta de nuevo.");
      await registrarRostro(foto.uri); // no regresa datos; si no truena, ya quedó guardado
      onRegistroExitoso();
    } catch (e: any) {
      Alert.alert("No se pudo registrar tu rostro", e?.message ?? "Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={typography.title}>Registra tu rostro</Text>
      <Text style={[typography.subtitle, { marginBottom: spacing.lg }]}>
        Solo lo harás una vez. Se usará para confirmar quién eres en cada
        checado.
      </Text>

      <View style={styles.viewfinder}>
        <CameraView ref={camaraRef} style={StyleSheet.absoluteFill} facing="front" />
        <View style={styles.ovalGuide} />
        <Text style={styles.hint}>Centra tu rostro dentro del óvalo</Text>
      </View>

      <BotonChecar
        label="Tomar foto"
        onPress={onPressTomarFoto}
        loading={cargando}
        disabled={cargando}
      />
      <EsperaVerificacion visible={cargando} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  centrado: { justifyContent: "center", alignItems: "center", gap: spacing.md },
  viewfinder: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  ovalGuide: {
    position: "absolute",
    width: "62%",
    height: "74%",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.violet,
    borderStyle: "dashed",
  },
  hint: {
    position: "absolute",
    bottom: 14,
    color: "#fff",
    fontSize: 11.5,
    fontWeight: "600",
  },
});
