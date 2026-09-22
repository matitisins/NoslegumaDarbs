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
    !defined("API_FOOTBALL_KEY") ||
    trim((string) API_FOOTBALL_KEY) === ""
) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "error" => "API_FOOTBALL_KEY nav ievietots backend/.env.",
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$leagueMap = [
    "PL" => 39,
    "PD" => 140,
    "SA" => 135,
    "BL1" => 78,
    "FL1" => 61,
];

$competition = strtoupper(
    trim($_GET["competition"] ?? "PL")
);

$season = trim(
    $_GET["season"] ?? "2026"
);

if (!isset($leagueMap[$competition])) {
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

$leagueId = $leagueMap[$competition];

$baseUrl = defined("API_FOOTBALL_BASE_URL")
    ? rtrim(API_FOOTBALL_BASE_URL, "/")
    : "https://v3.football.api-sports.io";

$cacheDir = __DIR__ . "/../cache";

if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0775, true);
}

$cacheFile = $cacheDir .
    "/api_football_" .
    strtolower($competition) .
    "_" .
    $season .
    ".json";

$cacheLifetime = 6 * 60 * 60;

function apiFootballRequest(
    string $url
): array {
    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            "x-apisports-key: " . API_FOOTBALL_KEY,
            "Accept: application/json",
        ],
        CURLOPT_USERAGENT => "Flow Football Analytics",
    ]);

    $body = curl_exec($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo(
        $ch,
        CURLINFO_HTTP_CODE
    );

    curl_close($ch);

    if ($body === false) {
        throw new RuntimeException(
            $error ?: "Nezināma API-Football cURL kļūda."
        );
    }

    return [
        "status" => $status,
        "body" => $body,
    ];
}

function apiError(
    int $status,
    string $message
): never {
    http_response_code($status);

    echo json_encode([
        "success" => false,
        "error" => $message,
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

function getNumber(
    mixed $value
): ?float {
    if ($value === null || $value === "") {
        return null;
    }

    if (!is_numeric($value)) {
        return null;
    }

    return (float) $value;
}

function getInt(
    mixed $value
): ?int {
    $number = getNumber($value);

    if ($number === null) {
        return null;
    }

    return (int) round($number);
}

function cleanPlayerStats(
    array $player
): array {
    $stats = $player["statistics"] ?? [];

    if (!is_array($stats)) {
        $stats = [];
    }

    return [
        "id" => $player["player"]["id"] ?? null,

        "name" =>
            $player["player"]["name"] ??
            null,

        "age" =>
            $player["player"]["age"] ??
            null,

        "nationality" =>
            $player["player"]["nationality"] ??
            null,

        "photo" =>
            $player["player"]["photo"] ??
            null,

        "injured" =>
            $player["player"]["injured"] ??
            false,

        "statistics" => $stats,
    ];
}

try {
    /*
     * Check that the league and season exist
     * and that player data is available.
     */
    $leagueUrl =
        $baseUrl .
        "/leagues?id=" .
        rawurlencode((string) $leagueId) .
        "&season=" .
        rawurlencode($season);

    $leagueResult =
        apiFootballRequest($leagueUrl);

    if ($leagueResult["status"] === 401) {
        apiError(
            401,
            "API-Football noraidīja API atslēgu (401). Pārbaudi API_FOOTBALL_KEY."
        );
    }

    if ($leagueResult["status"] === 403) {
        apiError(
            403,
            "API-Football neatļauj šo pieprasījumu (403)."
        );
    }

    if ($leagueResult["status"] === 429) {
        apiError(
            429,
            "API-Football request limits ir sasniegts (429)."
        );
    }

    if (
        $leagueResult["status"] < 200 ||
        $leagueResult["status"] >= 300
    ) {
        apiError(
            502,
            "API-Football atgrieza HTTP " .
            $leagueResult["status"] .
            "."
        );
    }

    $leagueData = json_decode(
        $leagueResult["body"],
        true
    );

    if (!is_array($leagueData)) {
        apiError(
            502,
            "API-Football atgrieza nederīgu league JSON."
        );
    }

    if (
        !empty($leagueData["errors"])
    ) {
        apiError(
            502,
            "API-Football: " .
            json_encode(
                $leagueData["errors"],
                JSON_UNESCAPED_UNICODE
            )
        );
    }

    $leagueResponse =
        $leagueData["response"] ?? [];

    if (!is_array($leagueResponse) || !$leagueResponse) {
        apiError(
            404,
            "API-Football neatrada izvēlēto līgu/sezonu."
        );
    }

    $seasonInfo =
        $leagueResponse[0]["seasons"] ?? [];

    $requestedSeason = null;

    foreach ($seasonInfo as $item) {
        if (
            (int) ($item["year"] ?? 0) ===
            (int) $season
        ) {
            $requestedSeason = $item;
            break;
        }
    }

    if (!$requestedSeason) {
        apiError(
            404,
            "API-Football neatrada sezonu " .
            $season .
            " šai līgai."
        );
    }

    $coverage =
        $requestedSeason["coverage"] ??
        [];

    if (
        isset($coverage["players"]) &&
        !$coverage["players"]
    ) {
        apiError(
            404,
            "API-Football šai līgai un sezonai vēl nav pieejami spēlētāju dati."
        );
    }

    /*
     * Return cache if available.
     */
    if (
        file_exists($cacheFile) &&
        time() -
            (int) filemtime($cacheFile) <
            $cacheLifetime
    ) {
        $cached =
            file_get_contents($cacheFile);

        if ($cached !== false) {
            $cachedData =
                json_decode($cached, true);

            if (
                is_array($cachedData) &&
                !empty($cachedData["players"])
            ) {
                $cachedData["cached"] = true;

                echo json_encode(
                    $cachedData,
                    JSON_UNESCAPED_UNICODE |
                    JSON_UNESCAPED_SLASHES
                );

                exit;
            }
        }
    }

    /*
     * API-Football returns 20 players per page.
     * We therefore have to follow pagination.
     */
    $allPlayers = [];

    $page = 1;

    $totalPages = 1;

    do {
        $playersUrl =
            $baseUrl .
            "/players?league=" .
            rawurlencode((string) $leagueId) .
            "&season=" .
            rawurlencode($season) .
            "&page=" .
            $page;

        $playersResult =
            apiFootballRequest($playersUrl);

        if ($playersResult["status"] === 401) {
            apiError(
                401,
                "API-Football noraidīja API atslēgu (401)."
            );
        }

        if ($playersResult["status"] === 403) {
            apiError(
                403,
                "API-Football neatļauj spēlētāju pieprasījumu (403)."
            );
        }

        if ($playersResult["status"] === 429) {
            apiError(
                429,
                "API-Football request limits ir sasniegts (429)."
            );
        }

        if (
            $playersResult["status"] < 200 ||
            $playersResult["status"] >= 300
        ) {
            apiError(
                502,
                "API-Football atgrieza HTTP " .
                $playersResult["status"] .
                " spēlētāju pieprasījumam."
            );
        }

        $playersData =
            json_decode(
                $playersResult["body"],
                true
            );

        if (!is_array($playersData)) {
            apiError(
                502,
                "API-Football atgrieza nederīgu player JSON."
            );
        }

        if (
            !empty($playersData["errors"])
        ) {
            apiError(
                502,
                "API-Football: " .
                json_encode(
                    $playersData["errors"],
                    JSON_UNESCAPED_UNICODE
                )
            );
        }

        $pagePlayers =
            $playersData["response"] ?? [];

        if (is_array($pagePlayers)) {
            foreach ($pagePlayers as $player) {
                $allPlayers[] =
                    cleanPlayerStats($player);
            }
        }

        $totalPages =
            max(
                1,
                (int) (
                    $playersData["paging"]["total"] ??
                    1
                )
            );

        $page++;

        /*
         * Safety limit.
         * A normal Premier League season should
         * stay well below this.
         */
        if ($page > 100) {
            break;
        }

    } while ($page <= $totalPages);

    if (!$allPlayers) {
        apiError(
            404,
            "API-Football neatgrieza nevienu spēlētāju."
        );
    }

    $response = [
        "success" => true,
        "source" => "api-football",
        "competition" => $competition,
        "leagueId" => $leagueId,
        "season" => (int) $season,
        "count" => count($allPlayers),
        "players" => $allPlayers,
        "coverage" => $coverage,
        "cached" => false,
    ];

    @file_put_contents(
        $cacheFile,
        json_encode(
            $response,
            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES
        )
    );

    echo json_encode(
        $response,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

} catch (Throwable $e) {
    apiError(
        500,
        "API-Football kļūda: " .
        $e->getMessage()
    );
}