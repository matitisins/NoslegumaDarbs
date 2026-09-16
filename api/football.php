<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Flow Football Analytics
| football-data.org API proxy
|--------------------------------------------------------------------------
|
| Frontend requests:
|
| /api/football.php?competition=PL&season=2026
|
| The API token is NOT stored in React.
| It is loaded from:
|
| ../src/api/config.php
|
|--------------------------------------------------------------------------
*/

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");

/*
|--------------------------------------------------------------------------
| Handle CORS preflight
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Only allow GET requests
|--------------------------------------------------------------------------
*/

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);

    echo json_encode(
        [
            "success" => false,
            "error" => "Atļauts tikai GET pieprasījums.",
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| Load configuration
|--------------------------------------------------------------------------
*/

$configFile = __DIR__ . "/../src/api/config.php";

if (!file_exists($configFile)) {
    http_response_code(500);

    echo json_encode(
        [
            "success" => false,
            "error" => "Config fails nav atrasts: src/api/config.php",
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

require_once $configFile;

/*
|--------------------------------------------------------------------------
| Check API token
|--------------------------------------------------------------------------
*/

if (
    !defined("FOOTBALL_DATA_API_TOKEN") ||
    FOOTBALL_DATA_API_TOKEN === "" ||
    FOOTBALL_DATA_API_TOKEN === "put the api here"
) {
    http_response_code(500);

    echo json_encode(
        [
            "success" => false,
            "error" => "Football-data.org API tokens nav ievietots src/api/config.php.",
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| Allowed competitions
|--------------------------------------------------------------------------
*/

$allowedCompetitions = [
    "PL",
    "PD",
    "SA",
    "BL1",
    "FL1",
];

/*
|--------------------------------------------------------------------------
| Read request parameters
|--------------------------------------------------------------------------
*/

$competition = strtoupper(
    trim($_GET["competition"] ?? "PL")
);

$season = trim(
    $_GET["season"] ?? "2026"
);

/*
|--------------------------------------------------------------------------
| Validate competition
|--------------------------------------------------------------------------
*/

if (!in_array($competition, $allowedCompetitions, true)) {
    http_response_code(400);

    echo json_encode(
        [
            "success" => false,
            "error" => "Neatbalstīta līga. Atļautas: PL, PD, SA, BL1, FL1.",
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| Validate season
|--------------------------------------------------------------------------
|
| Example:
| 2026
| 2025
|
*/

if (!preg_match("/^\d{4}$/", $season)) {
    http_response_code(400);

    echo json_encode(
        [
            "success" => false,
            "error" => "Sezonai jābūt četrciparu gadam, piemēram, 2026.",
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| Football-data.org request helper
|--------------------------------------------------------------------------
*/

function footballDataRequest(
    string $url,
    string $apiToken
): array {
    $ch = curl_init($url);

    if ($ch === false) {
        throw new RuntimeException(
            "Neizdevās inicializēt PHP cURL."
        );
    }

    curl_setopt_array(
        $ch,
        [
            CURLOPT_RETURNTRANSFER => true,

            CURLOPT_FOLLOWLOCATION => true,

            CURLOPT_CONNECTTIMEOUT => 10,

            CURLOPT_TIMEOUT => 30,

            CURLOPT_HTTPHEADER => [
                "X-Auth-Token: " . $apiToken,
                "Accept: application/json",
            ],

            CURLOPT_USERAGENT =>
                "Flow Football Analytics",
        ]
    );

    $body = curl_exec($ch);

    $curlError = curl_error($ch);

    $status = (int) curl_getinfo(
        $ch,
        CURLINFO_HTTP_CODE
    );

    curl_close($ch);

    if ($body === false) {
        throw new RuntimeException(
            "PHP cURL kļūda: " .
            ($curlError ?: "nezināma kļūda")
        );
    }

    return [
        "status" => $status,
        "body" => $body,
    ];
}

/*
|--------------------------------------------------------------------------
| Build football-data.org URL
|--------------------------------------------------------------------------
*/

$baseUrl =
    defined("FOOTBALL_DATA_API_BASE_URL")
        ? FOOTBALL_DATA_API_BASE_URL
        : "https://api.football-data.org/v4";

$url =
    rtrim($baseUrl, "/") .
    "/competitions/" .
    rawurlencode($competition) .
    "/scorers?season=" .
    rawurlencode($season) .
    "&limit=100";

/*
|--------------------------------------------------------------------------
| Request API
|--------------------------------------------------------------------------
*/

try {
    $result = footballDataRequest(
        $url,
        FOOTBALL_DATA_API_TOKEN
    );
} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode(
        [
            "success" => false,
            "error" => $e->getMessage(),
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| Read response
|--------------------------------------------------------------------------
*/

$status = $result["status"];

$body = $result["body"];

$data = json_decode(
    $body,
    true
);

/*
|--------------------------------------------------------------------------
| Invalid JSON
|--------------------------------------------------------------------------
*/

if (
    $data === null &&
    json_last_error() !== JSON_ERROR_NONE
) {
    http_response_code(502);

    echo json_encode(
        [
            "success" => false,
            "error" =>
                "Football-data.org atgrieza nederīgu JSON atbildi.",
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| 401 - Invalid API token
|--------------------------------------------------------------------------
*/

if ($status === 401) {
    http_response_code(401);

    echo json_encode(
        [
            "success" => false,
            "error" =>
                "Football-data.org noraidīja API tokenu (401). Pārbaudi tokenu src/api/config.php failā.",
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| 403 - Forbidden
|--------------------------------------------------------------------------
*/

if ($status === 403) {
    http_response_code(403);

    echo json_encode(
        [
            "success" => false,
            "error" =>
                "Football-data.org neatļauj šo pieprasījumu tavam kontam (403). Pārbaudi API plāna tiesības un tokenu.",
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| 404 - Competition/season not found
|--------------------------------------------------------------------------
*/

if ($status === 404) {
    http_response_code(404);

    echo json_encode(
        [
            "success" => false,
            "error" =>
                "Football-data.org neatrada norādīto līgu vai sezonu (404).",
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| 429 - Rate limit
|--------------------------------------------------------------------------
*/

if ($status === 429) {
    http_response_code(429);

    echo json_encode(
        [
            "success" => false,
            "error" =>
                "Football-data.org API pieprasījumu limits ir sasniegts (429). Uzgaidi un mēģini vēlreiz.",
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| Other HTTP errors
|--------------------------------------------------------------------------
*/

if ($status < 200 || $status >= 300) {
    $message = "";

    if (is_array($data)) {
        $message =
            $data["message"] ??
            $data["error"] ??
            "";
    }

    $httpStatus =
        $status >= 400 &&
        $status <= 599
            ? $status
            : 502;

    http_response_code($httpStatus);

    echo json_encode(
        [
            "success" => false,
            "error" =>
                "Football-data.org atgrieza HTTP " .
                $status .
                (
                    $message
                        ? ": " . $message
                        : "."
                ),
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| Validate response
|--------------------------------------------------------------------------
*/

if (!is_array($data)) {
    http_response_code(502);

    echo json_encode(
        [
            "success" => false,
            "error" =>
                "Football-data.org atgrieza nederīgu datu struktūru.",
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| Get scorers
|--------------------------------------------------------------------------
*/

$scorers = is_array(
    $data["scorers"] ?? null
)
    ? $data["scorers"]
    : [];

/*
|--------------------------------------------------------------------------
| Return data to React
|--------------------------------------------------------------------------
*/

echo json_encode(
    [
        "success" => true,

        "competition" =>
            $competition,

        "season" =>
            (int) $season,

        "count" =>
            count($scorers),

        "scorers" =>
            $scorers,

        "source" =>
            "football-data.org",
    ],
    JSON_UNESCAPED_UNICODE |
    JSON_UNESCAPED_SLASHES
);