<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Flow - Official Fantasy Premier League data proxy
|--------------------------------------------------------------------------
|
| This endpoint retrieves the current official Fantasy Premier League
| player data and exposes the total FPL points to the React application.
|
| It is intentionally kept separate from API-Football because FPL points
| include information such as:
|
| - Clean sheets
| - Defensive contributions
| - Bonus points / BPS
| - Penalty saves
| - Penalty misses
| - Own goals
| - Match-by-match appearance rules
|
| Those values cannot be reconstructed exactly from the aggregated
| API-Football player endpoint.
|
|--------------------------------------------------------------------------
*/

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);

    echo json_encode(
        [
            'success' => false,
            'error' => 'Only GET requests are allowed.',
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

$season = (int)($_GET['season'] ?? 2026);

/*
|--------------------------------------------------------------------------
| FPL currently represents the active 2026/27 season.
|--------------------------------------------------------------------------
|
| We only use official FPL totals when the requested season is 2026.
| For other seasons Flow falls back to its API-Football based calculation.
|
*/

if ($season !== 2026) {
    echo json_encode(
        [
            'success' => true,
            'available' => false,
            'season' => $season,
            'players' => [],
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

$cacheDirectory = __DIR__ . '/../cache';

if (!is_dir($cacheDirectory)) {
    @mkdir($cacheDirectory, 0775, true);
}

$cacheFile = $cacheDirectory . '/fpl-bootstrap-2026.json';

/*
|--------------------------------------------------------------------------
| Cache for 30 minutes
|--------------------------------------------------------------------------
*/

$cacheLifetime = 30 * 60;

if (
    is_file($cacheFile) &&
    (time() - (int)filemtime($cacheFile)) < $cacheLifetime
) {
    $cached = json_decode(
        (string)file_get_contents($cacheFile),
        true
    );

    if (
        is_array($cached) &&
        isset($cached['players']) &&
        is_array($cached['players'])
    ) {
        $cached['cached'] = true;

        echo json_encode(
            $cached,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );

        exit;
    }
}

/*
|--------------------------------------------------------------------------
| Request helper
|--------------------------------------------------------------------------
*/

function requestFpl(string $url): array
{
    $curl = curl_init($url);

    if ($curl === false) {
        return [
            'success' => false,
            'status' => 0,
            'error' => 'Unable to initialize cURL.',
            'data' => null,
        ];
    }

    curl_setopt_array(
        $curl,
        [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'User-Agent: Mozilla/5.0 Flow-Football-Analytics',
            ],
        ]
    );

    $body = curl_exec($curl);

    $error = curl_error($curl);
    $status = (int)curl_getinfo(
        $curl,
        CURLINFO_HTTP_CODE
    );

    curl_close($curl);

    if ($body === false || $error !== '') {
        return [
            'success' => false,
            'status' => $status,
            'error' => $error !== ''
                ? $error
                : 'FPL request failed.',
            'data' => null,
        ];
    }

    $data = json_decode(
        (string)$body,
        true
    );

    if (!is_array($data)) {
        return [
            'success' => false,
            'status' => $status,
            'error' => 'FPL returned invalid JSON.',
            'data' => null,
        ];
    }

    if ($status < 200 || $status >= 300) {
        return [
            'success' => false,
            'status' => $status,
            'error' => 'FPL returned HTTP ' . $status . '.',
            'data' => $data,
        ];
    }

    return [
        'success' => true,
        'status' => $status,
        'error' => null,
        'data' => $data,
    ];
}

/*
|--------------------------------------------------------------------------
| Get official FPL bootstrap data
|--------------------------------------------------------------------------
*/

$fplUrl = 'https://fantasy.premierleague.com/api/bootstrap-static/';

$result = requestFpl($fplUrl);

if (!$result['success']) {
    /*
     * If we have an old cache, use it rather than breaking Flow.
     */
    if (is_file($cacheFile)) {
        $stale = json_decode(
            (string)file_get_contents($cacheFile),
            true
        );

        if (
            is_array($stale) &&
            isset($stale['players']) &&
            is_array($stale['players'])
        ) {
            $stale['cached'] = true;
            $stale['stale'] = true;

            echo json_encode(
                $stale,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            );

            exit;
        }
    }

    http_response_code(502);

    echo json_encode(
        [
            'success' => false,
            'error' => 'Unable to load official Fantasy Premier League data.',
            'details' => $result['error'],
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

$bootstrap = $result['data'];

$elements = isset($bootstrap['elements'])
    && is_array($bootstrap['elements'])
    ? $bootstrap['elements']
    : [];

$teams = isset($bootstrap['teams'])
    && is_array($bootstrap['teams'])
    ? $bootstrap['teams']
    : [];

/*
|--------------------------------------------------------------------------
| Build team lookup
|--------------------------------------------------------------------------
*/

$teamNames = [];

foreach ($teams as $team) {
    if (!is_array($team)) {
        continue;
    }

    $teamId = (int)($team['id'] ?? 0);

    if ($teamId <= 0) {
        continue;
    }

    $teamNames[$teamId] =
        $team['name']
        ?? $team['short_name']
        ?? '';
}

/*
|--------------------------------------------------------------------------
| Build compact player dataset
|--------------------------------------------------------------------------
*/

$players = [];

foreach ($elements as $player) {
    if (!is_array($player)) {
        continue;
    }

    $playerId = (int)($player['id'] ?? 0);

    if ($playerId <= 0) {
        continue;
    }

    $teamId = (int)($player['team'] ?? 0);

    $firstName = trim(
        (string)($player['first_name'] ?? '')
    );

    $secondName = trim(
        (string)($player['second_name'] ?? '')
    );

    $webName = trim(
        (string)($player['web_name'] ?? '')
    );

    $fullName = trim(
        $firstName . ' ' . $secondName
    );

    if ($fullName === '') {
        $fullName = $webName;
    }

    $players[] = [
        'id' => $playerId,

        'name' => $fullName,

        'webName' => $webName,

        'teamId' => $teamId,

        'team' => $teamNames[$teamId] ?? '',

        /*
         * Official FPL total points.
         */
        'totalPoints' => (int)(
            $player['total_points'] ?? 0
        ),

        /*
         * Official FPL points per game.
         */
        'pointsPerGame' => (float)(
            $player['points_per_game'] ?? 0
        ),

        /*
         * Keep a few useful values available for debugging
         * and future Flow features.
         */
        'minutes' => (int)(
            $player['minutes'] ?? 0
        ),

        'goals' => (int)(
            $player['goals_scored'] ?? 0
        ),

        'assists' => (int)(
            $player['assists'] ?? 0
        ),

        'position' => (int)(
            $player['element_type'] ?? 0
        ),
    ];
}

$output = [
    'success' => true,

    'available' => true,

    'source' => 'official-fantasy-premier-league',

    'season' => 2026,

    'count' => count($players),

    'players' => $players,

    'cached' => false,
];

$json = json_encode(
    $output,
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);

if ($json === false) {
    http_response_code(500);

    echo json_encode(
        [
            'success' => false,
            'error' => 'Unable to encode FPL response.',
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

@file_put_contents(
    $cacheFile,
    $json,
    LOCK_EX
);

echo $json;