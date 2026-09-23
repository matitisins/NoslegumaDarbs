<?php

/*
 * Nodrošina konkrēta spēlētāja profila un sezonas statistikas iegūšanu
 * no API-Football pēc spēlētāja ID un sezonas, kā arī iegūst informāciju
 * par spēlētāja izcīnītajām trofejām.
 */

declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "error" => "Atļauts tikai GET pieprasījums.",
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . "/../src/api/config.php";

function readApiFootballKey(): string
{
    $names = [
        "API_FOOTBALL_API_KEY",
        "API_FOOTBALL_KEY",
        "API_FOOTBALL_TOKEN",
        "APIFOOTBALL_API_KEY",
        "APISPORTS_KEY",
        "APISPORTS_API_KEY",
        "API_SPORTS_KEY",
        "API_SPORTS_API_KEY",
        "FOOTBALL_API_KEY",
        "FOOTBALL_API_TOKEN",
    ];

    foreach ($names as $name) {
        if (defined($name) && trim((string) constant($name)) !== "") {
            return trim((string) constant($name));
        }

        $value = $_ENV[$name] ?? $_SERVER[$name] ?? getenv($name);

        if ($value !== false && trim((string) $value) !== "") {
            return trim((string) $value);
        }
    }

    return "";
}

function apiError(int $status, string $message): never
{
    http_response_code($status);

    echo json_encode([
        "success" => false,
        "error" => $message,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    exit;
}

$apiKey = readApiFootballKey();

if ($apiKey === "") {
    apiError(
        500,
        "API-Football atslēga nav pieejama servera konfigurācijā."
    );
}

$playerId = filter_input(INPUT_GET, "player", FILTER_VALIDATE_INT);
$season = trim((string) ($_GET["season"] ?? "2026"));

if (!$playerId || $playerId < 1) {
    apiError(400, "Nepieciešams derīgs player ID.");
}

if (!preg_match("/^\d{4}$/", $season)) {
    apiError(400, "Sezonai jābūt četrciparu gadam.");
}

$baseUrl = "https://v3.football.api-sports.io";
$cacheDir = __DIR__ . "/../cache/player-details";
$cacheKey = hash("sha256", $playerId . "_" . $season);
$cacheFile = $cacheDir . "/" . $cacheKey . ".json";
$cacheTtl = 60 * 60 * 6;

if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTtl) {
    $cached = file_get_contents($cacheFile);

    if ($cached !== false && trim($cached) !== "") {
        echo $cached;
        exit;
    }
}

if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0775, true);
}

function apiFootballRequest(string $url, string $apiKey): array
{
    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            "x-apisports-key: " . $apiKey,
            "Accept: application/json",
        ],
        CURLOPT_USERAGENT => "Flow Football Analytics",
    ]);

    $body = curl_exec($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    if ($body === false) {
        throw new RuntimeException(
            $error ?: "Nezināma API-Football cURL kļūda."
        );
    }

    $json = json_decode($body, true);

    return [
        "status" => $status,
        "data" => is_array($json) ? $json : null,
    ];
}

function optionalEndpoint(
    string $url,
    string $apiKey
): array {
    try {
        $result = apiFootballRequest($url, $apiKey);

        if (
            $result["status"] >= 200 &&
            $result["status"] < 300 &&
            is_array($result["data"])
        ) {
            return is_array($result["data"]["response"] ?? null)
                ? $result["data"]["response"]
                : [];
        }
    } catch (Throwable $e) {
    }

    return [];
}

try {
    $playerResult = apiFootballRequest(
        $baseUrl . "/players?id=" . rawurlencode((string) $playerId) . "&season=" . rawurlencode($season),
        $apiKey
    );
} catch (Throwable $e) {
    apiError(502, $e->getMessage());
}

if ($playerResult["status"] === 401 || $playerResult["status"] === 403) {
    apiError(
        $playerResult["status"],
        "API-Football noraidīja API pieprasījumu. Pārbaudi servera API atslēgu."
    );
}

if ($playerResult["status"] === 429) {
    apiError(
        429,
        "API-Football dienas limits vai pieprasījumu limits ir sasniegts."
    );
}

if ($playerResult["status"] < 200 || $playerResult["status"] >= 300) {
    apiError(
        502,
        "API-Football atgrieza HTTP " . $playerResult["status"] . "."
    );
}

$playerResponse = $playerResult["data"]["response"] ?? [];

if (!is_array($playerResponse) || !isset($playerResponse[0])) {
    apiError(404, "Spēlētājs šai sezonai nav atrasts.");
}

$playerEntry = $playerResponse[0];

$profile = is_array($playerEntry["player"] ?? null)
    ? $playerEntry["player"]
    : [];

$statistics = is_array($playerEntry["statistics"] ?? null)
    ? $playerEntry["statistics"]
    : [];

$trophies = optionalEndpoint(
    $baseUrl . "/trophies?player=" . rawurlencode((string) $playerId),
    $apiKey
);

$result = [
    "success" => true,
    "playerId" => (int) $playerId,
    "season" => (int) $season,
    "source" => "api-football",
    "profile" => $profile,
    "statistics" => $statistics,
    "trophies" => $trophies,
];

$json = json_encode(
    $result,
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);

if ($json === false) {
    apiError(500, "Neizdevās sagatavot profila JSON.");
}

if (is_dir($cacheDir)) {
    @file_put_contents($cacheFile, $json, LOCK_EX);
}

echo $json;