// src/components/EsperaVerificacion.tsx
//
// El microservicio facial corre en el plan gratuito de Render y se
// "duerme" tras ~15 min sin uso: la primera llamada después de eso puede
// tardar 30-50s en vez de 1-2s. Este overlay evita que el usuario piense
// que la app se colgó — muestra un spinner y, si la espera se alarga,
// cambia el mensaje para explicar por qué tarda.

import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";

type Props = { visible: boolean };

const MENSAJE_INICIAL = "Verificando tu rostro...";
const MENSAJE_LARGO =
  "Conectando con el servicio de verificación... la primera vez puede tardar hasta 50 segundos.";

export default function EsperaVerificacion({ visible }: Props) {
  const [mensaje, setMensaje] = useState(MENSAJE_INICIAL);

  useEffect(() => {
    if (!visible) {
      setMensaje(MENSAJE_INICIAL);
      return;
    }
    const timer = setTimeout(() => setMensaje(MENSAJE_LARGO), 3500);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator color={colors.purple} size="large" />
          <Text style={styles.texto}>{mensaje}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(32,28,32,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 26,
    alignItems: "center",
    gap: 14,
  },
  texto: {
    textAlign: "center",
    fontSize: 12.5,
    color: colors.muted,
    lineHeight: 18,
  },
});
