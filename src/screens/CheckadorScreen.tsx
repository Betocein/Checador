// src/screens/CheckadorScreen.tsx — pantalla principal.
//
// Flujo:
// 1. Huella/rostro del teléfono (LocalAuthentication.authenticateAsync())
//    es SOLO un candado local: no llama a Supabase ni al microservicio,
//    y no genera ningún checado por sí sola. Si falla, no se abre la cámara.
// 2. Si el candado local pasa, se abre la cámara y se llama
//    checarConRostro(fotoUri, tipo) — esa única llamada verifica el rostro
//    contra la base de datos E inserta el checado.
// 3. La respuesta trae { coincide, confianza }. Si coincide es false, se
//    muestra "No pudimos verificar tu identidad" y no se registró nada.
//
// El microservicio facial vive en el plan gratuito de Render y puede
// tardar 30-50s en "despertar": mientras esperamos la respuesta se
// muestra <EsperaVerificacion />, nunca se deja el botón sin feedback.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Modal, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as LocalAuthentication from "expo-local-authentication";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, typography } from "../theme";
import BotonChecar from "../components/BotonChecar";
import EsperaVerificacion from "../components/EsperaVerificacion";
import { checarConRostro } from "../lib/rostro";
import {
  ChecadaConPuntualidad,
  obtenerMisCheckadas,
  TipoChecada,
} from "../lib/checador";
import type { Empleado } from "../lib/auth";

type Props = { empleado: Empleado };

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function CheckadorScreen({ empleado }: Props) {
  const [hora, setHora] = useState(new Date());
  const [permiso] = useCameraPermissions();
  const [tipoEnCurso, setTipoEnCurso] = useState<TipoChecada | null>(null);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: TipoChecada; hora: string } | null>(null);
  const [ultima, setUltima] = useState<ChecadaConPuntualidad | null>(null);
  const [cargandoUltima, setCargandoUltima] = useState(true);
  const camaraRef = useRef<CameraView>(null);

  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const refrescarUltima = useCallback(() => {
    setCargandoUltima(true);
    obtenerMisCheckadas()
      .then((checadas) => setUltima(checadas[0] ?? null))
      .catch(() => {})
      .finally(() => setCargandoUltima(false));
  }, []);

  useEffect(() => {
    refrescarUltima();
  }, [refrescarUltima]);

  // Regla: solo se permite el tipo contrario al último checado. Si tu última
  // marca fue "entrada", "Checar entrada" queda bloqueado hasta que registres
  // la salida. Mientras no sabemos cuál fue (o está refrescando), ambos
  // botones se bloquean para no dejar pasar una marca doble.
  const tipoPendiente = ultima?.tipo ?? null;
  const entradaBloqueada = cargandoUltima || tipoPendiente === "entrada";
  const salidaBloqueada = cargandoUltima || tipoPendiente === "salida";

  const mensajeBloqueo = (tipo: TipoChecada) =>
    tipo === "entrada"
      ? "Ya tienes una entrada registrada. Registra tu salida."
      : "Ya tienes una salida registrada. Registra tu entrada.";

  async function onPressChecar(tipo: TipoChecada) {
    if (ultima?.tipo === tipo) {
      Alert.alert(
        tipo === "entrada" ? "Entrada ya registrada" : "Salida ya registrada",
        mensajeBloqueo(tipo)
      );
      return;
    }

    const bio = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirma que eres tú",
    });
    if (!bio.success) {
      Alert.alert("No se pudo verificar tu identidad");
      return;
    }

    if (!permiso?.granted) {
      Alert.alert("Necesitamos tu cámara", "Da permiso de cámara para poder checar.");
      return;
    }

    setTipoEnCurso(tipo);
    setMostrarCamara(true);
  }

  async function onPressTomarFotoParaChecar() {
    if (!camaraRef.current || !tipoEnCurso) return;
    setVerificando(true);
    try {
      const foto = await camaraRef.current.takePictureAsync({ quality: 0.7 });
      if (!foto) throw new Error("No se pudo tomar la foto, intenta de nuevo.");
      const { coincide } = await checarConRostro(foto.uri, tipoEnCurso);

      setMostrarCamara(false);

      if (!coincide) {
        Alert.alert("No pudimos verificar tu identidad");
        return;
      }

      setResultado({ tipo: tipoEnCurso, hora: new Date().toISOString() });
      // Traemos la última marca del servidor antes de cerrar el flujo: mientras
      // no llegue, ambos botones siguen bloqueados (cargandoUltima).
      refrescarUltima();
      setModalVisible(true);
    } catch (e: any) {
      setMostrarCamara(false);
      Alert.alert("No se pudo verificar el rostro", e?.message ?? "Intenta de nuevo.");
    } finally {
      setVerificando(false);
      setTipoEnCurso(null);
    }
  }

  if (mostrarCamara) {
    return (
      <View style={styles.container}>
        <View style={styles.viewfinder}>
          <CameraView ref={camaraRef} style={StyleSheet.absoluteFill} facing="front" />
          <View style={styles.ovalGuide} />
        </View>
        <BotonChecar
          label="Verificar rostro"
          onPress={onPressTomarFotoParaChecar}
          loading={verificando}
          disabled={verificando}
        />
        <BotonChecar
          label="Cancelar"
          variant="outline"
          disabled={verificando}
          onPress={() => {
            setMostrarCamara(false);
            setTipoEnCurso(null);
          }}
        />
        <EsperaVerificacion visible={verificando} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.employeeRow}>
        <LinearGradient colors={colors.gradient} style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciales(empleado.nombre_completo)}</Text>
        </LinearGradient>
        <View>
          <Text style={styles.nombre}>{empleado.nombre_completo}</Text>
          <Text style={styles.puesto}>{empleado.puesto ?? ""}</Text>
        </View>
      </View>

      <LinearGradient colors={colors.gradient} style={styles.clockCard}>
        <Text style={styles.clockTime}>
          {hora.toLocaleTimeString("es-MX", { hour12: false })}
        </Text>
        <Text style={styles.clockDate}>
          {hora.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>
      </LinearGradient>

      {ultima && (
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>
            Última {ultima.tipo} ·{" "}
            {new Date(ultima.hora).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {ultima.puntual !== null ? ` · ${ultima.puntual ? "Puntual" : "Tarde"}` : ""}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <BotonChecar
          label="Checar entrada"
          onPress={() => onPressChecar("entrada")}
          disabled={entradaBloqueada}
        />
        <BotonChecar
          label="Checar salida"
          variant="outline"
          onPress={() => onPressChecar("salida")}
          disabled={salidaBloqueada}
        />
        {tipoPendiente && !cargandoUltima && (
          <Text style={styles.hint}>
            {tipoPendiente === "entrada"
              ? "Ya registraste tu entrada. Ahora te toca registrar la salida."
              : "Ya registraste tu salida. Ahora te toca registrar la entrada."}
          </Text>
        )}
      </View>

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {resultado?.tipo === "entrada" ? "Entrada registrada" : "Salida registrada"}
            </Text>
            <Text style={typography.subtitle}>
              Biometría del teléfono y rostro verificados ·{" "}
              {resultado ? new Date(resultado.hora).toLocaleTimeString("es-MX") : ""}
            </Text>
            <BotonChecar label="Entendido" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  employeeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  nombre: { fontWeight: "700", fontSize: 13.5, color: colors.ink },
  puesto: { fontSize: 11, color: colors.muted },
  clockCard: { borderRadius: radius.lg, padding: 22, marginBottom: 16 },
  clockTime: { fontSize: 32, fontWeight: "800", color: "#fff" },
  clockDate: { fontSize: 11.5, color: "#fff", opacity: 0.9, marginTop: 4 },
  statusChip: {
    backgroundColor: colors.greenBg,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  statusText: { color: colors.green, fontWeight: "700", fontSize: 12 },
  actions: { marginTop: "auto" },
  hint: {
    ...typography.subtitle,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  viewfinder: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(32,28,32,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: colors.ink },
});
