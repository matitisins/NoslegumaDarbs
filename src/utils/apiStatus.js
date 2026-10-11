export const buildStaleFallback = (data, error) => ({
  data,
  source: "stale-cache",
  stale: true,
  warning: `Neizdevās atjaunot datus no servera. Tiek rādīti iepriekš saglabātie dati. ${error?.message || ""}`.trim(),
});

export const describeApiDataStatus = result => {
  if (result?.stale) return "stale";
  if (result?.source === "browser-cache") return "cached";
  if (result?.source === "server") return "live";
  return "unknown";
};
