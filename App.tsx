// App.tsx — punto de entrada y navegación.
//
// Antes de autenticarse: Login -> Registrar mi rostro (si rostro_registrado
// es false). Después: tabs de Checador / Historial / Perfil.
//
// obtenerEmpleadoActual() (lib/auth.ts) regresa null si no hay sesión, o
// el Empleado (con su campo rostro_registrado) si la hay. Ahí nos basamos
// para decidir a dónde mandar a la persona.

import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "./src/theme";
import { Empleado, obtenerEmpleadoActual } from "./src/lib/auth";
import { supabase } from "./src/lib/supabaseClient";

import LoginScreen from "./src/screens/LoginScreen";
import RegistrarRostroScreen from "./src/screens/RegistrarRostroScreen";
import CheckadorScreen from "./src/screens/CheckadorScreen";
import HistorialScreen from "./src/screens/HistorialScreen";
import PerfilScreen from "./src/screens/PerfilScreen";

const AuthStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

// Ionicons viene incluido con Expo (@expo/vector-icons) — es una fuente de
// íconos empaquetada con la app, no depende de emojis del sistema (eso era
// lo que se veía como un cuadro roto en el Samsung).
const ICONOS_TAB: Record<string, keyof typeof Ionicons.glyphMap> = {
  Checador: "timer-outline",
  Historial: "list-outline",
  Perfil: "person-circle-outline",
};

function MainTabs({
  empleado,
  onSesionCerrada,
}: {
  empleado: Empleado;
  onSesionCerrada: () => void;
}) {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONOS_TAB[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="Checador">
        {() => <CheckadorScreen empleado={empleado} />}
      </Tabs.Screen>
      <Tabs.Screen name="Historial" component={HistorialScreen} />
      <Tabs.Screen name="Perfil">
        {() => <PerfilScreen empleado={empleado} onSesionCerrada={onSesionCerrada} />}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

// La sesión queda guardada en AsyncStorage, así que al abrir la app con ella
// todavía cerrada hay que esperar a que supabase-js termine de leerla antes de
// preguntar quién es el usuario.
function esperarLecturaDeSesion(): Promise<void> {
  return new Promise((resolve) => {
    let subscription: { unsubscribe: () => void } | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let listo = false;

    const finalizar = () => {
      if (listo) return;
      listo = true;
      if (timer) clearTimeout(timer);
      subscription?.unsubscribe();
      resolve();
    };

    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "INITIAL_SESSION") finalizar();
    });
    subscription = data.subscription;
    // Red de seguridad: si el evento no llega, no dejamos la app en el spinner.
    timer = setTimeout(finalizar, 3000);
  });
}

// obtenerEmpleadoActual() -> getUser() hace una llamada de red al servidor de
// auth. En móvil un fallo puntual (sin señal al abrir la app, arranque en frío)
// no debe expulsarte al login, así que reintentamos una vez antes de rendernos.
async function cargarSesionInicial(): Promise<Empleado | null> {
  await esperarLecturaDeSesion();

  let ultimoError: unknown = null;
  for (let intento = 0; intento < 2; intento++) {
    try {
      return await obtenerEmpleadoActual();
    } catch (e) {
      ultimoError = e;
    }
  }
  throw ultimoError;
}

export default function App() {
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const cargarSesion = useCallback(() => {
    setCargandoSesion(true);
    setErrorCarga(null);
    cargarSesionInicial()
      .then(setEmpleado)
      .catch((e) => setErrorCarga(e?.message ?? "No se pudo cargar tu sesión."))
      .finally(() => setCargandoSesion(false));
  }, []);

  useEffect(cargarSesion, [cargarSesion]);

  if (cargandoSesion) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {errorCarga && (
        <View style={styles.banner}>
          <Text style={styles.bannerTexto}>{errorCarga}</Text>
          <TouchableOpacity onPress={cargarSesion} style={styles.bannerBoton}>
            <Text style={styles.bannerBotonTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
      {!empleado ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login">
            {() => (
              <LoginScreen
                onLoginExitoso={cargarSesion}
              />
            )}
          </AuthStack.Screen>
        </AuthStack.Navigator>
      ) : !empleado.rostro_registrado ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="RegistrarRostro">
            {() => (
              <RegistrarRostroScreen
                onRegistroExitoso={() =>
                  setEmpleado((prev) => (prev ? { ...prev, rostro_registrado: true } : prev))
                }
              />
            )}
          </AuthStack.Screen>
        </AuthStack.Navigator>
      ) : (
        <MainTabs empleado={empleado} onSesionCerrada={() => setEmpleado(null)} />
      )}
    </NavigationContainer>
  );
}

const styles = {
  banner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 12,
    padding: 12,
    backgroundColor: colors.softPurple,
  },
  bannerTexto: { flex: 1, color: colors.purpleDeep, fontSize: 12 },
  bannerBoton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.purple,
  },
  bannerBotonTexto: { color: "#fff", fontSize: 12, fontWeight: "700" as const },
};
