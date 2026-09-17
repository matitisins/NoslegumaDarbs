<?php

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

if (
    !defined("FOOTBALL_DATA_API_TOKEN") ||
    trim((string) FOOTBALL_DATA_API_TOKEN) === ""
) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "API tokens nav ievietots src/api/config.php.",
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$allowed = [
    "PL",
    "PD",
    "SA",
    "BL1",
    "FL1",
];

$competition = strtoupper(
    trim($_GET["competition"] ?? "PL")
);

$season = trim(
    $_GET["season"] ?? "2026"
);

if (!in_array($competition, $allowed, true)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Neatbalstīta līga.",
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if (!preg_match("/^\d{4}$/", $season)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "error" => "Sezonai jābūt četrciparu gadam.",
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

function footballRequest(string $url): array
{
    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            "X-Auth-Token: " . FOOTBALL_DATA_API_TOKEN,
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
            $error ?: "Nezināma cURL kļūda."
        );
    }

    return [
        "status" => $status,
        "body" => $body,
    ];
}

function apiError(int $status, string $message): never
{
    http_response_code($status);

    echo json_encode([
        "success" => false,
        "error" => $message,
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$base = defined("FOOTBALL_DATA_API_BASE_URL")
    ? rtrim(FOOTBALL_DATA_API_BASE_URL, "/")
    : "https://api.football-data.org/v4";

$scorersUrl =
    $base .
    "/competitions/" .
    rawurlencode($competition) .
    "/scorers?season=" .
    rawurlencode($season) .
    "&limit=100";

$teamsUrl =
    $base .
    "/competitions/" .
    rawurlencode($competition) .
    "/teams?season=" .
    rawurlencode($season);

try {
    $scorersResult = footballRequest($scorersUrl);
    $teamsResult = footballRequest($teamsUrl);
} catch (Throwable $e) {
    apiError(500, $e->getMessage());
}

foreach ([$scorersResult, $teamsResult] as $result) {
    if ($result["status"] === 401) {
        apiError(
            401,
            "Football-data.org noraidīja API tokenu (401). Pārbaudi src/api/config.php."
        );
    }

    if ($result["status"] === 403) {
        apiError(
            403,
            "Football-data.org neatļauj šo pieprasījumu (403). Pārbaudi API plāna tiesības."
        );
    }

    if ($result["status"] === 404) {
        apiError(
            404,
            "Līga vai sezona nav atrasta (404)."
        );
    }

    if ($result["status"] === 429) {
        apiError(
            429,
            "Football-data.org API limits ir sasniegts (429). Uzgaidi un mēģini vēlreiz."
        );
    }

    if ($result["status"] < 200 || $result["status"] >= 300) {
        apiError(
            502,
            "Football-data.org atgrieza HTTP " .
            $result["status"] .
            "."
        );
    }
}

$scorerData = json_decode(
    $scorersResult["body"],
    true
);

$teamData = json_decode(
    $teamsResult["body"],
    true
);

if (!is_array($scorerData) || !is_array($teamData)) {
    apiError(
        502,
        "Football-data.org atgrieza nederīgu JSON."
    );
}

$scorers = is_array($scorerData["scorers"] ?? null)
    ? $scorerData["scorers"]
    : [];

$teams = is_array($teamData["teams"] ?? null)
    ? $teamData["teams"]
    : [];

echo json_encode([
    "success" => true,
    "competition" => $competition,
    "season" => (int) $season,
    "count" => count($scorers),
    "scorers" => $scorers,
    "teams" => $teams,
    "source" => "football-data.org",
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);