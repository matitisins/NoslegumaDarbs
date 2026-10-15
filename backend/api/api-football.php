<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../src/api/config.php';

enforceCorsPolicy();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Atļauts tikai GET pieprasījums.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Rate limiting is applied only when a cache miss requires an upstream request.

if (API_FOOTBALL_KEY === '') {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Servera vides mainīgais API_FOOTBALL_KEY nav konfigurēts.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$cacheDirectory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'cache';

if (
    !is_dir($cacheDirectory) &&
    !mkdir($cacheDirectory, 0775, true) &&
    !is_dir($cacheDirectory)
) {
    error_log('Flow API-Football cache directory could not be created.');
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'error' => 'Kešatmiņa īslaicīgi nav pieejama.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function apiFootballCacheFile(string $key): string
{
    global $cacheDirectory;

    return $cacheDirectory .
        DIRECTORY_SEPARATOR .
        'api_football_' .
        hash('sha256', $key) .
        '.json';
}

function apiFootballReadCache(
    string $file,
    int $ttl,
    bool $allowStale = false
): ?array {
    if (!is_file($file)) {
        return null;
    }

    $modified = filemtime($file);

    if ($modified === false) {
        return null;
    }

    if (!$allowStale && time() - $modified > $ttl) {
        return null;
    }

    $contents = file_get_contents($file);

    if ($contents === false || trim($contents) === '') {
        return null;
    }

    $data = json_decode($contents, true);

    return is_array($data) ? $data : null;
}

function apiFootballWriteCache(string $file, array $data): void
{
    $contents = json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    if (
        $contents === false ||
        file_put_contents($file, $contents, LOCK_EX) === false
    ) {
        error_log('Flow API-Football cache write failed: ' . $file);
    }
}

function apiFootballRespondError(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode([
        'success' => false,
        'error' => $message,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function apiFootballRequest(string $endpoint, array $params): array
{
    $query = http_build_query($params);
    $url = rtrim(API_FOOTBALL_BASE_URL, '/') .
        '/' . ltrim($endpoint, '/') .
        ($query !== '' ? '?' . $query : '');

    $curl = curl_init($url);

    if ($curl === false) {
        throw new RuntimeException('Neizdevās inicializēt cURL.');
    }

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            'x-apisports-key: ' . API_FOOTBALL_KEY,
            'Accept: application/json',
        ],
        CURLOPT_USERAGENT => 'Flow Football Analytics',
    ]);

    $body = curl_exec($curl);
    $curlError = curl_error($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);

    if ($body === false) {
        throw new RuntimeException(
            $curlError !== '' ? $curlError : 'Nezināma cURL kļūda.'
        );
    }

    $decoded = json_decode($body, true);

    if (!is_array($decoded)) {
        throw new RuntimeException(
            'API-Football atgrieza nederīgu JSON atbildi.'
        );
    }

    return [
        'status' => $status,
        'data' => $decoded,
    ];
}

function apiFootballFetch(
    string $endpoint,
    array $params,
    string $cacheKey,
    int $ttl
): array {
    $file = apiFootballCacheFile($cacheKey);

    $cached = apiFootballReadCache($file, $ttl);

    if ($cached !== null) {
        return [
            'data' => $cached,
            'cached' => true,
            'stale' => false,
        ];
    }

    $lock = acquireCacheRefreshLock($file);

    if ($lock !== null) {
        $cached = apiFootballReadCache($file, $ttl);

        if ($cached !== null) {
            releaseCacheRefreshLock($lock);

            return [
                'data' => $cached,
                'cached' => true,
                'stale' => false,
            ];
        }
    }

    try {
        // Do not spend the upstream request allowance on cache hits.
        enforceRateLimit(
            'api-football',
            RATE_LIMIT_WINDOW_SECONDS,
            RATE_LIMIT_API_FOOTBALL_REQUESTS
        );

        $response = apiFootballRequest($endpoint, $params);

        if (
            $response['status'] < 200 ||
            $response['status'] >= 300
        ) {
            throw new RuntimeException(
                'API-Football atgrieza HTTP ' .
                $response['status'] . '.'
            );
        }

        $data = $response['data'];

        if (isset($data['errors']) && $data['errors'] !== []) {
            throw new RuntimeException(
                'API-Football ziņoja par pieprasījuma kļūdu.'
            );
        }

        apiFootballWriteCache($file, $data);

        if ($lock !== null) {
            releaseCacheRefreshLock($lock);
        }

        return [
            'data' => $data,
            'cached' => false,
            'stale' => false,
        ];
    } catch (Throwable $error) {
        if ($lock !== null) {
            releaseCacheRefreshLock($lock);
        }

        error_log(
            'Flow API-Football request failed (' .
            $endpoint . '): ' . $error->getMessage()
        );

        $stale = apiFootballReadCache($file, $ttl, true);

        if ($stale !== null) {
            return [
                'data' => $stale,
                'cached' => true,
                'stale' => true,
            ];
        }

        throw $error;
    }
}

$action = strtolower(trim((string)($_GET['action'] ?? 'players')));

$allowedActions = [
    'standings',
    'fixtures',
    'teams',
    'team-stats',
    'h2h',
    'fdr',
    'players',
    'top-scorers',
    'top-assists',
];

if (!in_array($action, $allowedActions, true)) {
    apiFootballRespondError(400, 'Neatbalstīta API darbība.');
}

$params = [];
$endpoint = '';
$cacheKey = '';
$ttl = CACHE_TTL_API_FOOTBALL_PLAYERS;

switch ($action) {
    case 'standings':
    case 'fixtures':
        $league = filter_input(INPUT_GET, 'league', FILTER_VALIDATE_INT);
        $season = trim((string)($_GET['season'] ?? ''));

        if (!$league || !preg_match('/^\d{4}$/', $season)) {
            apiFootballRespondError(
                400,
                'Eiropas sacensību datiem nepieciešams derīgs league un season.'
            );
        }

        $endpoint = $action === 'standings' ? 'standings' : 'fixtures';
        $params = ['league' => $league, 'season' => $season];
        if ($action === 'fixtures') {
            $status = strtoupper(trim((string)($_GET['status'] ?? '')));
            $next = filter_input(INPUT_GET, 'next', FILTER_VALIDATE_INT);
            $last = filter_input(INPUT_GET, 'last', FILTER_VALIDATE_INT);

            if ($status !== '') {
                $allowedStatuses = ['NS', 'FT', 'AET', 'PEN', 'LIVE'];
                if (!in_array($status, $allowedStatuses, true)) {
                    apiFootballRespondError(400, 'Nederīgs spēļu statuss.');
                }
                $params['status'] = $status;
            }

            // Prefer next/last filters for European match lists; status-only
            // requests can omit AET/PEN matches and do not guarantee a useful sample.
            if ($next !== false && $next !== null) {
                if ($next < 1 || $next > 50) {
                    apiFootballRespondError(400, 'Parametram next jābūt no 1 līdz 50.');
                }
                $params['next'] = $next;
                unset($params['status']);
            } elseif ($last !== false && $last !== null) {
                if ($last < 1 || $last > 50) {
                    apiFootballRespondError(400, 'Parametram last jābūt no 1 līdz 50.');
                }
                $params['last'] = $last;
                unset($params['status']);
            }
        }
        $cacheKey = $action . ':' . $league . ':' . $season . ':' .
            hash('sha256', json_encode($params, JSON_UNESCAPED_SLASHES) ?: '');
        $ttl = $action === 'standings' ? CACHE_TTL_API_FOOTBALL_TEAMS : CACHE_TTL_API_FOOTBALL_FDR;
        break;

    case 'teams':
        $league = filter_input(INPUT_GET, 'league', FILTER_VALIDATE_INT);
        $season = trim((string)($_GET['season'] ?? ''));

        if (!$league || !preg_match('/^\d{4}$/', $season)) {
            apiFootballRespondError(
                400,
                'Komandu pieprasījumam nepieciešams derīgs league un season.'
            );
        }

        $endpoint = 'teams';
        $params = [
            'league' => $league,
            'season' => $season,
        ];
        $cacheKey = 'teams:' . $league . ':' . $season;
        $ttl = CACHE_TTL_API_FOOTBALL_TEAMS;
        break;

    case 'team-stats':
        $team = filter_input(INPUT_GET, 'team', FILTER_VALIDATE_INT);
        $league = filter_input(INPUT_GET, 'league', FILTER_VALIDATE_INT);
        $season = trim((string)($_GET['season'] ?? ''));

        if (
            !$team ||
            !$league ||
            !preg_match('/^\d{4}$/', $season)
        ) {
            apiFootballRespondError(
                400,
                'Komandas statistikai nepieciešams team, league un season.'
            );
        }

        $endpoint = 'teams/statistics';
        $params = [
            'team' => $team,
            'league' => $league,
            'season' => $season,
        ];
        $cacheKey = 'team-stats:' . $team . ':' . $league . ':' . $season;
        $ttl = CACHE_TTL_API_FOOTBALL_TEAM_STATS;
        break;

    case 'h2h':
        $teams = trim((string)($_GET['teams'] ?? ''));

        if (
            !preg_match('/^\d+-\d+$/', $teams) ||
            preg_match('/^(\d+)-\1$/', $teams)
        ) {
            apiFootballRespondError(
                400,
                'Savstarpējo spēļu pieprasījumam nepieciešami divi atšķirīgi komandu ID.'
            );
        }

        $endpoint = 'fixtures/headtohead';
        $params = [
            'h2h' => $teams,
            'last' => 10,
        ];
        $cacheKey = 'h2h:' . $teams;
        $ttl = CACHE_TTL_API_FOOTBALL_H2H;
        break;

    case 'fdr':
        $league = filter_input(INPUT_GET, 'league', FILTER_VALIDATE_INT);
        $season = trim((string)($_GET['season'] ?? ''));

        if (!$league || !preg_match('/^\d{4}$/', $season)) {
            apiFootballRespondError(
                400,
                'FDR pieprasījumam nepieciešams derīgs league un season.'
            );
        }

        $endpoint = 'fixtures';
        $params = [
            'league' => $league,
            'season' => $season,
            'next' => 10,
        ];
        $cacheKey = 'fdr:' . $league . ':' . $season;
        $ttl = CACHE_TTL_API_FOOTBALL_FDR;
        break;

    case 'top-scorers':
    case 'top-assists':
        $league = filter_input(INPUT_GET, 'league', FILTER_VALIDATE_INT);
        $season = trim((string)($_GET['season'] ?? ''));

        if (!$league || !preg_match('/^\d{4}$/', $season)) {
            apiFootballRespondError(
                400,
                'Līgas spēlētāju statistikai nepieciešams derīgs league un season.'
            );
        }

        $endpoint = $action === 'top-assists' ? 'players/topassists' : 'players/topscorers';
        $params = [
            'league' => $league,
            'season' => $season,
        ];
        $cacheKey = $action . ':' . $league . ':' . $season;
        $ttl = CACHE_TTL_API_FOOTBALL_PLAYERS;
        break;

    case 'players':
    default:
        $league = filter_input(INPUT_GET, 'league', FILTER_VALIDATE_INT);
        $season = trim((string)($_GET['season'] ?? ''));
        $team = filter_input(INPUT_GET, 'team', FILTER_VALIDATE_INT);
        $player = filter_input(INPUT_GET, 'player', FILTER_VALIDATE_INT);
        $page = filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT);

        if (!$league || !preg_match('/^\d{4}$/', $season)) {
            apiFootballRespondError(
                400,
                'Spēlētāju pieprasījumam nepieciešams derīgs league un season.'
            );
        }

        $endpoint = 'players';
        $params = [
            'league' => $league,
            'season' => $season,
            'page' => max(1, $page ?: 1),
        ];

        if ($team) {
            $params['team'] = $team;
        }

        if ($player) {
            $params['id'] = $player;
        }

        $cacheKey = 'players:' . hash(
            'sha256',
            json_encode($params, JSON_UNESCAPED_SLASHES) ?: ''
        );
        $ttl = CACHE_TTL_API_FOOTBALL_PLAYERS;
        break;
}

try {
    $result = apiFootballFetch(
        $endpoint,
        $params,
        $cacheKey,
        $ttl
    );

    echo json_encode([
        'success' => true,
        'action' => $action,
        'response' => $result['data']['response'] ?? [],
        'results' => $result['data']['results'] ?? 0,
        'paging' => $result['data']['paging'] ?? null,
        'cached' => $result['cached'],
        'stale' => $result['stale'],
        'source' => 'api-football',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    apiFootballRespondError(
        502,
        'Neizdevās iegūt datus no API-Football. Mēģini vēlāk.'
    );
}
