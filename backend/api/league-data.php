<?php

/*
 * Papildu League Tables serviss Flow lietotnei.
 * Apstrādā līgas tabulas un spēļu pieprasījumus, izmantojot API-Football.
 * Esošie backend/api/api-football.php un football.php faili netiek mainīti.
 */

declare(strict_types=1);

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
    echo json_encode([
        'success' => false,
        'error' => 'Only GET requests are allowed.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/../src/api/config.php';
enforceRateLimit('league-data', 60, 60);

if (API_FOOTBALL_KEY === '') {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'API-Football API key is missing from backend/.env.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$competition = strtoupper(trim((string)($_GET['competition'] ?? 'PL')));
$season = (int)($_GET['season'] ?? 2026);
$mode = strtolower(trim((string)($_GET['mode'] ?? 'standings')));

$competitions = [
    'PL' => ['id' => 39, 'name' => 'Premier League'],
    'PD' => ['id' => 140, 'name' => 'La Liga'],
    'SA' => ['id' => 135, 'name' => 'Serie A'],
    'BL1' => ['id' => 78, 'name' => 'Bundesliga'],
    'FL1' => ['id' => 61, 'name' => 'Ligue 1'],
];

if (!isset($competitions[$competition])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Unsupported league.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($season < 2000 || $season > 2100) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid season.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!in_array($mode, ['standings', 'fixtures'], true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Unsupported league-data mode.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$leagueId = $competitions[$competition]['id'];
$leagueName = $competitions[$competition]['name'];

$cacheDirectory = __DIR__ . '/../cache';

if (!is_dir($cacheDirectory)) {
    if (!mkdir($cacheDirectory, 0775, true) && !is_dir($cacheDirectory)) {
        error_log('Flow league-data cache directory could not be created: ' . $cacheDirectory);
    }
}

function writeLeagueCache(string $file, string $json): void
{
    if (file_put_contents($file, $json, LOCK_EX) === false) {
        error_log('Flow league-data cache write failed: ' . $file);
    }
}

function requestApiFootball(string $endpoint, array $params): array
{
    $url = rtrim(API_FOOTBALL_BASE_URL, '/') . '/' . ltrim($endpoint, '/') . '?' . http_build_query($params);

    $curl = curl_init($url);

    if ($curl === false) {
        return [
            'success' => false,
            'httpCode' => 0,
            'error' => 'Unable to initialize cURL.',
            'response' => null,
        ];
    }

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_HTTPHEADER => [
            'x-apisports-key: ' . API_FOOTBALL_KEY,
            'Accept: application/json',
        ],
    ]);

    $body = curl_exec($curl);
    $error = curl_error($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);

    if ($body === false) {
        return [
            'success' => false,
            'httpCode' => $status,
            'error' => $error !== '' ? $error : 'Unknown cURL error.',
            'response' => null,
        ];
    }

    $json = json_decode($body, true);

    if (!is_array($json)) {
        return [
            'success' => false,
            'httpCode' => $status,
            'error' => 'API-Football returned invalid JSON.',
            'response' => null,
        ];
    }

    $errors = $json['errors'] ?? [];

    if ($status < 200 || $status >= 300 || (is_array($errors) && count($errors) > 0)) {
        $parts = [];

        if (is_array($errors)) {
            foreach ($errors as $value) {
                $parts[] = is_scalar($value)
                    ? (string)$value
                    : json_encode($value, JSON_UNESCAPED_UNICODE);
            }
        }

        return [
            'success' => false,
            'httpCode' => $status,
            'error' => count($parts) > 0
                ? implode(' | ', $parts)
                : 'API-Football HTTP ' . $status,
            'response' => $json,
        ];
    }

    return [
        'success' => true,
        'httpCode' => $status,
        'error' => null,
        'response' => $json,
    ];
}

function sendLeagueError(int $status, string $message): never
{
    http_response_code($status);

    echo json_encode([
        'success' => false,
        'error' => $message,
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($mode === 'standings') {
    $cacheFile = $cacheDirectory . '/league-data-standings-' . $competition . '-' . $season . '.json';
    $cacheLifetime = 15 * 60;

    if (is_file($cacheFile) && (time() - (int)filemtime($cacheFile)) < $cacheLifetime) {
        $cached = json_decode((string)file_get_contents($cacheFile), true);

        if (is_array($cached) && count($cached['standings'] ?? []) > 0) {
            $cached['cached'] = true;
            echo json_encode($cached, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }

    $result = requestApiFootball('standings', [
        'league' => $leagueId,
        'season' => $season,
    ]);

    if (!$result['success']) {
        sendLeagueError(
            $result['httpCode'] >= 400 ? $result['httpCode'] : 502,
            $result['error'] ?? 'Unable to load league standings.'
        );
    }

    $rawStandings = $result['response']['response'][0]['league']['standings'][0] ?? [];

    if (!is_array($rawStandings)) {
        $rawStandings = [];
    }

    $standings = [];

    foreach ($rawStandings as $row) {
        if (!is_array($row)) {
            continue;
        }

        $team = is_array($row['team'] ?? null) ? $row['team'] : [];
        $all = is_array($row['all'] ?? null) ? $row['all'] : [];
        $goals = is_array($all['goals'] ?? null) ? $all['goals'] : [];

        $teamId = (int)($team['id'] ?? 0);

        if ($teamId <= 0) {
            continue;
        }

        $position = isset($row['rank']) ? (int)$row['rank'] : null;
        $goalsDiff = isset($row['goalsDiff']) ? (int)$row['goalsDiff'] : null;

        $standings[] = [
            'position' => $position,
            'rank' => $position,
            'team' => [
                'id' => $teamId,
                'name' => $team['name'] ?? 'Unknown',
                'logo' => $team['logo'] ?? null,
                'crest' => $team['logo'] ?? null,
                'tla' => $team['code'] ?? null,
            ],
            'playedGames' => isset($all['played']) ? (int)$all['played'] : null,
            'won' => isset($all['win']) ? (int)$all['win'] : null,
            'draw' => isset($all['draw']) ? (int)$all['draw'] : null,
            'lost' => isset($all['lose']) ? (int)$all['lose'] : null,
            'goalsFor' => isset($goals['for']) ? (int)$goals['for'] : null,
            'goalsAgainst' => isset($goals['against']) ? (int)$goals['against'] : null,
            'goalDifference' => $goalsDiff,
            'goalsDiff' => $goalsDiff,
            'points' => isset($row['points']) ? (int)$row['points'] : null,
            'form' => $row['form'] ?? null,
            'status' => $row['status'] ?? null,
            'description' => $row['description'] ?? null,
        ];
    }

    usort($standings, static function (array $a, array $b): int {
        return (int)($a['position'] ?? 999) <=> (int)($b['position'] ?? 999);
    });

    if (count($standings) === 0) {
        sendLeagueError(502, 'API-Football neatgrieza līgas tabulas datus.');
    }

    $output = [
        'success' => true,
        'source' => 'api-football',
        'mode' => 'standings',
        'competition' => $competition,
        'competitionName' => $leagueName,
        'leagueId' => $leagueId,
        'season' => $season,
        'standings' => $standings,
        'cached' => false,
    ];

    writeLeagueCache(
        $cacheFile,
        json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        LOCK_EX
    );

    echo json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$cacheFile = $cacheDirectory . '/league-data-fixtures-' . $competition . '-' . $season . '.json';
$cacheLifetime = 5 * 60;

if (is_file($cacheFile) && (time() - (int)filemtime($cacheFile)) < $cacheLifetime) {
    $cached = json_decode((string)file_get_contents($cacheFile), true);

    if (
        is_array($cached) &&
        is_array($cached['upcoming'] ?? null) &&
        is_array($cached['recent'] ?? null)
    ) {
        $cached['cached'] = true;
        echo json_encode($cached, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

$upcomingResult = requestApiFootball('fixtures', [
    'league' => $leagueId,
    'season' => $season,
    'next' => 10,
]);

$recentResult = requestApiFootball('fixtures', [
    'league' => $leagueId,
    'season' => $season,
    'last' => 10,
]);

if (!$upcomingResult['success'] && !$recentResult['success']) {
    sendLeagueError(502, 'Neizdevās ielādēt spēles.');
}

$normalizeFixtures = static function (array $fixtures): array {
    $result = [];

    foreach ($fixtures as $fixture) {
        if (!is_array($fixture)) {
            continue;
        }

        $fixtureId = (int)($fixture['fixture']['id'] ?? 0);

        if ($fixtureId <= 0) {
            continue;
        }

        $result[] = [
            'fixture' => [
                'id' => $fixtureId,
                'date' => $fixture['fixture']['date'] ?? null,
                'timestamp' => $fixture['fixture']['timestamp'] ?? null,
                'status' => $fixture['fixture']['status'] ?? [],
                'venue' => $fixture['fixture']['venue'] ?? null,
            ],
            'league' => [
                'id' => $fixture['league']['id'] ?? null,
                'name' => $fixture['league']['name'] ?? null,
                'round' => $fixture['league']['round'] ?? null,
            ],
            'teams' => [
                'home' => [
                    'id' => $fixture['teams']['home']['id'] ?? null,
                    'name' => $fixture['teams']['home']['name'] ?? 'Unknown',
                    'logo' => $fixture['teams']['home']['logo'] ?? null,
                    'winner' => $fixture['teams']['home']['winner'] ?? null,
                ],
                'away' => [
                    'id' => $fixture['teams']['away']['id'] ?? null,
                    'name' => $fixture['teams']['away']['name'] ?? 'Unknown',
                    'logo' => $fixture['teams']['away']['logo'] ?? null,
                    'winner' => $fixture['teams']['away']['winner'] ?? null,
                ],
            ],
            'goals' => [
                'home' => $fixture['goals']['home'] ?? null,
                'away' => $fixture['goals']['away'] ?? null,
            ],
        ];
    }

    return $result;
};

$upcoming = $upcomingResult['success']
    ? $normalizeFixtures($upcomingResult['response']['response'] ?? [])
    : [];

$recent = $recentResult['success']
    ? $normalizeFixtures($recentResult['response']['response'] ?? [])
    : [];

usort($upcoming, static function (array $a, array $b): int {
    return (int)($a['fixture']['timestamp'] ?? 0) <=> (int)($b['fixture']['timestamp'] ?? 0);
});

usort($recent, static function (array $a, array $b): int {
    return (int)($b['fixture']['timestamp'] ?? 0) <=> (int)($a['fixture']['timestamp'] ?? 0);
});

$output = [
    'success' => true,
    'source' => 'api-football',
    'mode' => 'fixtures',
    'competition' => $competition,
    'competitionName' => $leagueName,
    'leagueId' => $leagueId,
    'season' => $season,
    'upcoming' => $upcoming,
    'recent' => $recent,
    'cached' => false,
];

file_put_contents(
    $cacheFile,
    json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    LOCK_EX
);

echo json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);