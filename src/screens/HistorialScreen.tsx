// src/screens/HistorialScreen.tsx
// obtenerMisCheckadas() regresa un arreglo plano (más reciente primero).
// Aquí lo agrupamos por día local y usamos calcularHorasDelDia() de
// checador.ts (ya viene resuelto) para el resumen de horas — solo lectura.

import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme";
import TarjetaCheckada from "../components/TarjetaCheckada";
import {
  calcularHorasDelDia,
  ChecadaConPuntualidad,
  obtenerMisCheckadas,
} from "../lib/checador";

type Dia = {
  fecha: string; // YYYY-MM-DD, en hora local del dispositivo
  checadas: ChecadaConPuntualidad[];
  horasTrabajadas: number | null;
};

function fechaLocal(iso: string): string {
  const d = new Date(iso);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function formatearHorasTrabajadas(horas: number): string {
  const totalMinutos = Math.round(horas * 60);
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatearFecha(fecha: string): string {
  // fecha viene como "YYYY-MM-DD"; se arma con año/mes/día por separado
  // (no con `new Date(fecha)`) para no correr el día por husos horarios.
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const d = new Date(anio, mes - 1, dia);
  const texto = d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function agruparPorDia(checadas: ChecadaConPuntualidad[]): Dia[] {
  const porFecha = new Map<string, ChecadaConPuntualidad[]>();
  for (const checada of checadas) {
    const fecha = fechaLocal(checada.hora);
    if (!porFecha.has(fecha)) porFecha.set(fecha, []);
    porFecha.get(fecha)!.push(checada);
  }

  return Array.from(porFecha.entries()).map(([fecha, delDia]) => {
    const entrada = [...delDia].reverse().find((c) => c.tipo === "entrada")?.hora ?? null;
    const salida = delDia.find((c) => c.tipo === "salida")?.hora ?? null;
    return {
      fecha,
      checadas: delDia,
      horasTrabajadas: calcularHorasDelDia(entrada, salida),
    };
  });
}

export default function HistorialScreen() {
  const [dias, setDias] = useState<Dia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    obtenerMisCheckadas()
      .then((checadas) => {
        setDias(agruparPorDia(checadas));
        setError(null);
      })
      .catch((e) => setError(e?.message ?? "No se pudo cargar tu historial."))
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  return (
    <View style={styles.container}>
      <Text style={typography.title}>Historial</Text>
      <Text style={[typography.subtitle, { marginBottom: spacing.lg }]}>
        Tus checados más recientes primero.
      </Text>

      {error && <Text style={{ color: colors.purpleDeep, marginBottom: spacing.md }}>{error}</Text>}

      <FlatList
        data={dias}
        keyExtractor={(item) => item.fecha}
        refreshing={cargando}
        onRefresh={cargar}
        ListEmptyComponent={
          !cargando ? <Text style={typography.subtitle}>Todavía no tienes checadas.</Text> : null
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.lg }}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNum}>
                {item.horasTrabajadas !== null ? formatearHorasTrabajadas(item.horasTrabajadas) : "—"}
              </Text>
              <Text style={typography.label}>{formatearFecha(item.fecha)}</Text>
            </View>
            {item.checadas.map((checada) => (
              <TarjetaCheckada key={checada.id} checada={checada} />
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.bg },
  summaryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryNum: { fontSize: 19, fontWeight: "800", color: colors.ink },
});
