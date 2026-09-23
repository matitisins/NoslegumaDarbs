<?php

/*
 * Šis fails nodrošina savienojumu ar API-Football un apstrādā futbola
 * līgu, spēlētāju un komandu datus. Tas iegūst spēlētāju sezonas statistiku
 * izvēlētajai līgai un sezonai, kā arī aprēķina komandas FDR rādītāju,
 * izmantojot līgas tabulas pozīcijas un nākamās spēles.
 *
 * Fails izmanto kešatmiņu, lai samazinātu API pieprasījumu skaitu un
 * uzlabotu datu ielādes ātrumu. API atslēga tiek iegūta no backend/.env
 * faila, nevis glabāta pašā PHP kodā.
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
    echo json_encode(['success' => false, 'error' => 'Only GET requests are allowed.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/../src/api/config.php';

if (API_FOOTBALL_KEY === '') {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'API-Football API key is missing from backend/.env.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$competition = strtoupper(trim((string)($_GET['competition'] ?? 'PL')));
$season = (int)($_GET['season'] ?? 2026);
$mode = strtolower(trim((string)($_GET['mode'] ?? 'players')));
$teamId = (int)($_GET['team'] ?? 0);

$competitions = [
    'PL' => ['id' => 39, 'name' => 'Premier League'],
    'PD' => ['id' => 140, 'name' => 'La Liga'],
    'SA' => ['id' => 135, 'name' => 'Serie A'],
    'BL1' => ['id' => 78, 'name' => 'Bundesliga'],
    'FL1' => ['id' => 61, 'name' => 'Ligue 1'],
];

if (!isset($competitions[$competition])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Unsupported league.', 'competition' => $competition], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($season < 2000 || $season > 2100) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid season.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$leagueId = $competitions[$competition]['id'];
$leagueName = $competitions[$competition]['name'];
$cacheDirectory = __DIR__ . '/../cache';

if (!is_dir($cacheDirectory)) {
    @mkdir($cacheDirectory, 0775, true);
}

function apiFootballRequest(string $endpoint, array $params): array
{
    $baseUrl = rtrim(API_FOOTBALL_BASE_URL, '/');
    $url = $baseUrl . '/' . ltrim($endpoint, '/') . '?' . http_build_query($params);

    $curl = curl_init($url);

    if ($curl === false) {
        return ['success' => false, 'httpCode' => 0, 'error' => 'Unable to initialize cURL.', 'response' => null];
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
    $curlError = curl_error($curl);
    $httpCode = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($body === false) {
        return ['success' => false, 'httpCode' => $httpCode, 'error' => $curlError ?: 'Unknown cURL error.', 'response' => null];
    }

    $json = json_decode($body, true);

    if (!is_array($json)) {
        return ['success' => false, 'httpCode' => $httpCode, 'error' => 'API-Football returned invalid JSON.', 'response' => null];
    }

    $errors = $json['errors'] ?? [];
    $hasErrors = is_array($errors) && count($errors) > 0;

    if ($httpCode < 200 || $httpCode >= 300 || $hasErrors) {
        $errorText = '';
        if (is_array($errors)) {
            $parts = [];
            foreach ($errors as $value) {
                $parts[] = is_scalar($value) ? (string)$value : json_encode($value, JSON_UNESCAPED_UNICODE);
            }
            $errorText = implode(' | ', $parts);
        } else {
            $errorText = (string)$errors;
        }

        return [
            'success' => false,
            'httpCode' => $httpCode,
            'error' => $errorText !== '' ? $errorText : 'API-Football HTTP ' . $httpCode,
            'response' => $json,
        ];
    }

    return ['success' => true, 'httpCode' => $httpCode, 'error' => null, 'response' => $json];
}

function sendApiError(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}


/*
|--------------------------------------------------------------------------
| Team list mode
|--------------------------------------------------------------------------
*/
if ($mode === 'teams') {
    $cacheFile = $cacheDirectory . '/teams-' . $competition . '-' . $season . '.json';
    $cacheLifetime = 30 * 60;

    if (is_file($cacheFile) && (time() - (int)filemtime($cacheFile)) < $cacheLifetime) {
        $cached = json_decode((string)file_get_contents($cacheFile), true);
        if (is_array($cached)) {
            $cached['cached'] = true;
            echo json_encode($cached, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }

    $result = apiFootballRequest('teams', [
        'league' => $leagueId,
        'season' => $season,
    ]);

    if (!$result['success']) {
        sendApiError($result['httpCode'] >= 400 ? $result['httpCode'] : 502, 'Unable to load teams.');
    }

    $teams = [];

    foreach (($result['response']['response'] ?? []) as $item) {
        if (!is_array($item)) continue;

        $team = $item['team'] ?? [];
        $venue = $item['venue'] ?? [];
        $id = (int)($team['id'] ?? 0);

        if ($id <= 0) continue;

        $teams[] = [
            'id' => $id,
            'name' => $team['name'] ?? 'Unknown',
            'code' => $team['code'] ?? null,
            'country' => $team['country'] ?? null,
            'logo' => $team['logo'] ?? null,
            'founded' => $team['founded'] ?? null,
            'venue' => [
                'id' => $venue['id'] ?? null,
                'name' => $venue['name'] ?? null,
                'city' => $venue['city'] ?? null,
                'capacity' => $venue['capacity'] ?? null,
            ],
        ];
    }

    $output = [
        'success' => true,
        'source' => 'api-football',
        'mode' => 'teams',
        'competition' => $competition,
        'competitionName' => $leagueName,
        'leagueId' => $leagueId,
        'season' => $season,
        'count' => count($teams),
        'teams' => $teams,
        'cached' => false,
    ];

    @file_put_contents($cacheFile, json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

    echo json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/*
|--------------------------------------------------------------------------
| Team season statistics mode
|--------------------------------------------------------------------------
*/
if ($mode === 'team-stats') {
    if ($teamId <= 0) {
        sendApiError(400, 'A team ID is required for team statistics.');
    }

    $cacheFile = $cacheDirectory . '/team-stats-' . $competition . '-' . $season . '-' . $teamId . '.json';
    $cacheLifetime = 30 * 60;

    if (is_file($cacheFile) && (time() - (int)filemtime($cacheFile)) < $cacheLifetime) {
        $cached = json_decode((string)file_get_contents($cacheFile), true);
        if (is_array($cached)) {
            $cached['cached'] = true;
            echo json_encode($cached, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }

    $result = apiFootballRequest('teams/statistics', [
        'league' => $leagueId,
        'season' => $season,
        'team' => $teamId,
    ]);

    if (!$result['success']) {
        sendApiError($result['httpCode'] >= 400 ? $result['httpCode'] : 502, 'Unable to load team statistics.');
    }

    $response = $result['response']['response'] ?? null;

    if (!is_array($response)) {
        sendApiError(502, 'API-Football returned no team statistics.');
    }

    $output = [
        'success' => true,
        'source' => 'api-football',
        'mode' => 'team-stats',
        'competition' => $competition,
        'leagueId' => $leagueId,
        'season' => $season,
        'teamId' => $teamId,
        'statistics' => $response,
        'cached' => false,
    ];

    @file_put_contents($cacheFile, json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

    echo json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/*
|--------------------------------------------------------------------------
| Head-to-head mode
|--------------------------------------------------------------------------
*/
if ($mode === 'h2h') {
    $team1 = (int)($_GET['team1'] ?? 0);
    $team2 = (int)($_GET['team2'] ?? 0);
    $last = (int)($_GET['last'] ?? 5);
    $last = max(1, min(20, $last));

    if ($team1 <= 0 || $team2 <= 0 || $team1 === $team2) {
        sendApiError(400, 'Two different team IDs are required for H2H.');
    }

    $low = min($team1, $team2);
    $high = max($team1, $team2);
    $cacheFile = $cacheDirectory . '/h2h-' . $low . '-' . $high . '-' . $last . '.json';
    $cacheLifetime = 60 * 60;

    if (is_file($cacheFile) && (time() - (int)filemtime($cacheFile)) < $cacheLifetime) {
        $cached = json_decode((string)file_get_contents($cacheFile), true);
        if (is_array($cached)) {
            $cached['cached'] = true;
            echo json_encode($cached, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }

    $result = apiFootballRequest('fixtures/headtohead', [
        'h2h' => $team1 . '-' . $team2,
        'last' => $last,
    ]);

    if (!$result['success']) {
        sendApiError($result['httpCode'] >= 400 ? $result['httpCode'] : 502, 'Unable to load head-to-head data.');
    }

    $matches = $result['response']['response'] ?? [];
    if (!is_array($matches)) $matches = [];

    $output = [
        'success' => true,
        'source' => 'api-football',
        'mode' => 'h2h',
        'team1' => $team1,
        'team2' => $team2,
        'last' => $last,
        'count' => count($matches),
        'matches' => $matches,
        'cached' => false,
    ];

    @file_put_contents($cacheFile, json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

    echo json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/*
|--------------------------------------------------------------------------
| Real fixture difficulty mode
|--------------------------------------------------------------------------
|
| Uses API-Football standings + the team's next five fixtures.
| Each opponent receives a difficulty from its league position:
| 1-4 = 5, 5-8 = 4, 9-12 = 3, 13-16 = 2, 17-20 = 1.
| The returned FDR is the average of the available opponent ratings.
|--------------------------------------------------------------------------
*/
if ($mode === 'fdr') {
    if ($teamId <= 0) {
        sendApiError(400, 'A team ID is required for FDR calculation.');
    }

    $cacheFile = $cacheDirectory . '/fdr-' . $competition . '-' . $season . '-' . $teamId . '.json';
    $cacheLifetime = 15 * 60;

    if (is_file($cacheFile) && (time() - (int)filemtime($cacheFile)) < $cacheLifetime) {
        $cached = json_decode((string)file_get_contents($cacheFile), true);
        if (is_array($cached)) {
            $cached['cached'] = true;
            echo json_encode($cached, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }

    $standingsResult = apiFootballRequest('standings', [
        'league' => $leagueId,
        'season' => $season,
    ]);

    if (!$standingsResult['success']) {
        sendApiError($standingsResult['httpCode'] >= 400 ? $standingsResult['httpCode'] : 502, 'Unable to load league standings for FDR.');
    }

    $table = [];
    foreach (($standingsResult['response']['response'][0]['league']['standings'][0] ?? []) as $row) {
        if (!is_array($row)) continue;
        $id = (int)($row['team']['id'] ?? 0);
        $position = (int)($row['rank'] ?? 0);
        if ($id > 0 && $position > 0) {
            $table[$id] = $position;
        }
    }

    $fixturesResult = apiFootballRequest('fixtures', [
        'league' => $leagueId,
        'season' => $season,
        'team' => $teamId,
        'next' => 5,
    ]);

    if (!$fixturesResult['success']) {
        sendApiError($fixturesResult['httpCode'] >= 400 ? $fixturesResult['httpCode'] : 502, 'Unable to load upcoming fixtures for FDR.');
    }

    $ratings = [];
    $fixtures = [];

    foreach (($fixturesResult['response']['response'] ?? []) as $fixture) {
        if (!is_array($fixture)) continue;

        $homeId = (int)($fixture['teams']['home']['id'] ?? 0);
        $awayId = (int)($fixture['teams']['away']['id'] ?? 0);
        $opponentId = $homeId === $teamId ? $awayId : $homeId;

        if ($opponentId <= 0) continue;

        $opponentPosition = $table[$opponentId] ?? null;
        if ($opponentPosition === null) continue;

        if ($opponentPosition <= 4) {
            $difficulty = 5;
        } elseif ($opponentPosition <= 8) {
            $difficulty = 4;
        } elseif ($opponentPosition <= 12) {
            $difficulty = 3;
        } elseif ($opponentPosition <= 16) {
            $difficulty = 2;
        } else {
            $difficulty = 1;
        }

        $ratings[] = $difficulty;
        $fixtures[] = [
            'opponent' => $homeId === $teamId
                ? ($fixture['teams']['away']['name'] ?? 'Unknown')
                : ($fixture['teams']['home']['name'] ?? 'Unknown'),
            'opponentPosition' => $opponentPosition,
            'difficulty' => $difficulty,
            'date' => $fixture['fixture']['date'] ?? null,
            'home' => $homeId === $teamId,
        ];
    }

    $fdr = count($ratings) > 0
        ? round(array_sum($ratings) / count($ratings), 1)
        : 3;

    $output = [
        'success' => true,
        'source' => 'api-football',
        'mode' => 'fdr',
        'competition' => $competition,
        'season' => $season,
        'teamId' => $teamId,
        'fdr' => $fdr,
        'fixtures' => $fixtures,
        'cached' => false,
    ];

    @file_put_contents($cacheFile, json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

    echo json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/*
|--------------------------------------------------------------------------
| Player data mode
|--------------------------------------------------------------------------
*/
$cacheFile = $cacheDirectory . '/api-football-' . $competition . '-' . $season . '.json';
$cacheLifetime = 30 * 60;

if (is_file($cacheFile) && (time() - (int)filemtime($cacheFile)) < $cacheLifetime) {
    $cached = json_decode((string)file_get_contents($cacheFile), true);
    if (is_array($cached)) {
        $cached['cached'] = true;
        echo json_encode($cached, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

$allPlayers = [];
$maximumPages = 100;

for ($page = 1; $page <= $maximumPages; $page++) {
    $result = apiFootballRequest('players', [
        'league' => $leagueId,
        'season' => $season,
        'page' => $page,
    ]);

    if (!$result['success']) {
        if (is_file($cacheFile)) {
            $stale = json_decode((string)file_get_contents($cacheFile), true);
            if (is_array($stale)) {
                $stale['cached'] = true;
                $stale['stale'] = true;
                echo json_encode($stale, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                exit;
            }
        }

        http_response_code($result['httpCode'] >= 400 ? $result['httpCode'] : 502);
        echo json_encode([
            'success' => false,
            'error' => 'API-Football error.',
            'details' => $result['error'],
            'httpCode' => $result['httpCode'],
            'competition' => $competition,
            'leagueId' => $leagueId,
            'season' => $season,
            'endpoint' => 'players',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $data = $result['response'] ?? [];
    $pagePlayers = $data['response'] ?? [];

    if (is_array($pagePlayers)) {
        foreach ($pagePlayers as $player) {
            if (is_array($player)) {
                $allPlayers[] = $player;
            }
        }
    }

    $currentPage = (int)($data['paging']['current'] ?? $page);
    $totalPages = (int)($data['paging']['total'] ?? $page);

    if ($currentPage >= $totalPages) {
        break;
    }
}

$output = [
    'success' => true,
    'source' => 'api-football',
    'competition' => $competition,
    'competitionName' => $leagueName,
    'leagueId' => $leagueId,
    'season' => $season,
    'count' => count($allPlayers),
    'players' => $allPlayers,
    'cached' => false,
];

@file_put_contents($cacheFile, json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

echo json_encode($output, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
