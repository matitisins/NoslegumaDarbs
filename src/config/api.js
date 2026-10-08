/*
 * Centrālā frontend API konfigurācija.
 *
 * Development režīmā API tiek izsaukts caur Vite proxy:
 *
 *   /backend/api
 *
 * Production režīmā, kad frontend tiek palaists no tās pašas
 * Apache mapes kā backend, relatīvais ceļš automātiski norāda
 * uz pašas lietotnes backend direktoriju.
 */

const normalizeBaseUrl = value =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "");

const configuredBaseUrl =
  normalizeBaseUrl(
    import.meta.env.VITE_API_BASE_URL
  );

const isViteDevelopment =
  Boolean(
    import.meta.env.DEV
  );

let defaultBaseUrl =
  "/backend/api";

if (
  !isViteDevelopment &&
  typeof window !== "undefined"
) {
  try {
    defaultBaseUrl =
      new URL(
        "./backend/api",
        document.baseURI
      ).toString();
  } catch {
    defaultBaseUrl =
      "/backend/api";
  }
}

export const API_BASE_URL =
  configuredBaseUrl ||
  defaultBaseUrl;

export default API_BASE_URL;