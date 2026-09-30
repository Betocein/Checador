// theme.ts — única fuente de colores/tipografía/espaciados de la app.
// Regla del proyecto: nunca hex directo en los componentes, siempre desde aquí.

export const colors = {
  bg: "#FAF8F7",
  card: "#FFFFFF",
  ink: "#201C20",
  muted: "#8B8590",
  line: "rgba(32,28,32,0.08)",

  // acento principal (morado), usado solo en botones primarios,
  // la tarjeta del reloj y el aro de verificación biométrica
  purple: "#7C3AED",
  purpleDeep: "#5B21B6",
  violet: "#A855F7",
  gradient: ["#5B21B6", "#8B3DF0", "#C084FC"] as const,
  softPurple: "#F1E7FE",

  // estados
  green: "#1FAE6D",
  greenBg: "#E4F7EE",
  danger: "#7C3AED", // "tarde" y cerrar sesión usan el mismo morado profundo, no rojo
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  title: { fontSize: 20, fontWeight: "800" as const, color: colors.ink },
  subtitle: { fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  body: { fontSize: 14, color: colors.ink },
  label: { fontSize: 11.5, fontWeight: "600" as const, color: colors.muted },
  button: { fontSize: 14.5, fontWeight: "700" as const },
};
