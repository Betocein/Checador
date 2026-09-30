# app-movil-checador

Front end móvil (Expo/React Native) del proyecto **Smart Display + Checador
Biométrico**. Esta es la parte de **Iñaki** — la Smart Display (Android TV)
la hace Levi, y el backend/Supabase/microservicio facial los hace
**Bryan Fernando Medina Zavala**.

## Regla de oro

Solo se edita dentro de `src/screens/` y `src/components/`. Todo lo de
`src/lib/` (`auth.ts`, `checador.ts`, `rostro.ts`, `supabaseClient.ts`) es
la versión **real** que entregó Fernando, ya ajustada a las variables de
entorno del proyecto — se importa y se usa, no se modifica.

El `.env` ya viene lleno con los valores reales (Supabase + el
microservicio facial en Render). No hace falta pedir nada más para
empezar a probar.

## Cómo correrlo

```bash
npm install
npx expo start
```

## Actualizar el SDK de Android

Esta carpeta ya incluye `android/`, generada con `npx expo prebuild`, configurada
para compilar contra **Android 15 (API 35)** — la versión mínima que Google
Play exige hoy para apps existentes — en vez del **API 34** que trae por
default Expo SDK 51. Esto se hizo con el plugin `expo-build-properties` en
`app.json`:

```json
["expo-build-properties", {
  "android": {
    "compileSdkVersion": 35,
    "targetSdkVersion": 35,
    "buildToolsVersion": "35.0.0"
  }
}]
```

**Por qué no API 36 (Android 16):** Google Play ya exige API 36 para apps
*nuevas* a partir del 31 de agosto de 2026, pero el Android Gradle Plugin que
trae Expo SDK 51 (React Native 0.74) es la versión 8.2.1, certificada por
Google solo hasta API 34 — usar API 36 con ese AGP puede provocar errores
reales de build (no solo advertencias), según lo que reportan otros
proyectos con esa misma combinación. API 35 sí es seguro con AGP 8.2.1
(Google solo marca una advertencia, no un error, y así se probó aquí). Si
más adelante quieres llegar a API 36 de verdad, el camino correcto es
actualizar todo el proyecto a un SDK de Expo más reciente (hoy la más
nueva es la 57) — es un cambio bastante más grande que toca muchas
dependencias a la vez, así que pídemelo aparte cuando quieras hacerlo.

### En Android Studio

1. Abre Android Studio → **Tools → SDK Manager**.
2. Pestaña **SDK Platforms**: marca **Android 15.0 ("VanillaIceCream") /
   API 35** (no necesitas quitar las que ya tengas) → Apply, para que se
   descargue.
3. Pestaña **SDK Tools**: asegúrate de tener marcados **Android SDK
   Build-Tools 35**, **Android SDK Platform-Tools** y **Android SDK
   Command-line Tools (latest)** → Apply.
4. Abre la carpeta `android/` de este proyecto directamente en Android
   Studio (**File → Open**) y deja que termine el Gradle Sync. Si prefieres
   la terminal, `npx expo run:android` también funciona y usa esta misma
   carpeta `android/` en vez de regenerarla.

### Error "Unsupported class file major version 70" (o similar)

Significa que Gradle está corriendo con un JDK más nuevo del que soporta
(Gradle 8.8 llega hasta Java 22; "major version 70" es Java 26). Ya se fijó
`org.gradle.java.home` en `android/gradle.properties` apuntando al JDK que
trae Android Studio (JBR), en la ruta más común en Windows:

```
C:\Program Files\Android\Android Studio\jbr
```

**Si esta ruta no existe en tu máquina** (instalaste Android Studio en otro
lado, o usas JetBrains Toolbox):

1. Abre Android Studio → **File → Settings → Build, Execution, Deployment →
   Build Tools → Gradle**. Ahí, el campo **"Gradle JDK"** te muestra la ruta
   real que Android Studio está usando — cópiala tal cual.
2. Pégala en `android/gradle.properties`, reemplazando la línea
   `org.gradle.java.home=...` (en Windows, escribe cada `\` como `\\`).
3. Vuelve a correr `npx expo run:android` (o Gradle Sync en Android
   Studio).

## Cuenta de prueba

```
correo:      inaki@gmail.com
contraseña:  134679
```

La primera vez que inicies sesión con esta cuenta, `rostro_registrado`
viene en `false`, así que la app te manda directo a "Registrar mi
rostro" en vez de al checador — es el comportamiento esperado. Una vez
registrado, ya puedes probar el flujo normal: huella para desbloquear la
cámara → foto → `checarConRostro`.

## Cold start del microservicio facial (Render, plan gratuito)

El servicio de verificación facial se "duerme" tras ~15 min sin uso. La
primera llamada a `registrarRostro()` o `checarConRostro()` después de
un rato puede tardar 30-50s en vez de 1-2s — no es un error. Por eso
`RegistrarRostroScreen` y `CheckadorScreen` muestran
`<EsperaVerificacion />` mientras esperan la respuesta: un overlay con
spinner que, si la espera se alarga (>3.5s), cambia su mensaje a
"Conectando con el servicio de verificación..." para que quede claro que
la app no se colgó.

## Estructura

```
app-movil-checador/
  App.tsx                     # navegación: Login -> Registrar rostro -> Tabs
  src/
    screens/
      LoginScreen.tsx
      RegistrarRostroScreen.tsx
      CheckadorScreen.tsx
      HistorialScreen.tsx
      PerfilScreen.tsx
    lib/                       # creado por Fernando — no tocar
      supabaseClient.ts
      auth.ts
      checador.ts
      rostro.ts
    components/
      BotonChecar.tsx
      TarjetaCheckada.tsx
      EsperaVerificacion.tsx   # spinner + mensaje para el cold start de Render
    theme.ts
```

## Flujo de Checador (importante)

1. Al tocar "Checar entrada/salida", `LocalAuthentication.authenticateAsync()`
   es solo un candado local del teléfono. **No** llama a Supabase ni genera
   ningún checado por sí solo. Si falla, no se abre la cámara.
2. Si pasa, se abre la cámara y se llama `checarConRostro(fotoUri, tipo)`.
   Esa única función verifica el rostro contra la base de datos **e**
   inserta el checado — no hay una función aparte para "registrar" el
   checado.
3. La respuesta es `{ coincide, confianza }`. Si `coincide` es `false`, se
   muestra "No pudimos verificar tu identidad" y no se registró nada.

## Notas

- `CheckadorScreen` y `PerfilScreen` reciben el `Empleado` real (de
  `obtenerEmpleadoActual()`) desde `App.tsx` — ya no hay datos de ejemplo
  hardcodeados.
- `HistorialScreen` agrupa por día el arreglo plano que regresa
  `obtenerMisCheckadas()` y usa `calcularHorasDelDia()` (ya resuelta en
  `lib/checador.ts`) para el resumen de horas.
- Si `obtenerEmpleadoActual()` truena (por ejemplo, un usuario de Auth
  sin fila en `empleados`), `App.tsx` lo muestra como un aviso arriba de
  la pantalla en vez de dejar la app en blanco.
