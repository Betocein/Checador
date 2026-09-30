// src/components/TarjetaCheckada.tsx
// Una fila del historial: tipo (entrada/salida), hora, y el tag de
// puntual/tarde cuando aplica (puntual es null en las checadas de salida).

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import type { ChecadaConPuntualidad } from "../lib/checador";

type Props = { checada: ChecadaConPuntualidad };

function formatearHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TarjetaCheckada({ checada }: Props) {
  const esEntrada = checada.tipo === "entrada";

  return (
    <View style={styles.row}>
      <View
        style={[styles.dot, { backgroundColor: esEntrada ? colors.green : colors.violet }]}
      />
      <View style={styles.main}>
        <Text style={styles.tipo}>
          {esEntrada ? "Entrada" : "Salida"} · {formatearHora(checada.hora)}
        </Text>
      </View>
      {checada.puntual !== null && (
        <View
          style={[
            styles.tag,
            { backgroundColor: checada.puntual ? colors.greenBg : colors.softPurple },
          ]}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: checada.puntual ? colors.green : colors.purpleDeep,
            }}
          >
            {checada.puntual ? "Puntual" : "Tarde"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  main: { flex: 1 },
  tipo: { fontSize: 13, fontWeight: "700", color: colors.ink },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
});
