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

enforceRateLimit(
    'player-details',
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_PLAYER_DETAILS_REQUESTS
);

$playerId = filter_input(INPUT_GET, 'player', FILTER_VALIDATE_INT);

if (!$playerId || $playerId < 1) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Nepieciešams derīgs spēlētāja ID.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (API_FOOTBALL_KEY === '') {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Servera vides mainīgais API_FOOTBALL_KEY nav konfigurēts.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$season = trim((string)($_GET['season'] ?? date('Y')));
$league = filter_input(INPUT_GET, 'league', FILTER_VALIDATE_INT);

if (!preg_match('/^\d{4}$/', $season)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Sezonai jābūt četrciparu gadam.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$cacheDirectory =
    dirname(__DIR__) .
    DIRECTORY_SEPARATOR .
    'cache';

if (
    !is_dir($cacheDirectory) &&
    !mkdir($cacheDirectory, 0775, true) &&
    !is_dir($cacheDirectory)
) {
    error_log('Flow player-details cache directory could not be created.');

    http_response_code(503);
    echo json_encode([
        'success' => false,
        'error' => 'Kešatmiņa īslaicīgi nav pieejama.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$cacheKey = 'player_details_' .
    $playerId .
    '_' .
    $season .
    '_' .
    ($league ?: 'all');

$cacheFile =
    $cacheDirectory .
    DIRECTORY_SEPARATOR .
    hash('sha256', $cacheKey) .
    '.json';

function playerDetailsReadCache(
    string $file,
    bool $allowStale = false
): ?array {
    if (!is_file($file)) {
        return null;
    }

    $modified = filemtime($file);

    if ($modified === false) {
        return null;
    }

    if (
        !$allowStale &&
        time() - $modified > CACHE_TTL_PLAYER_DETAILS
    ) {
        return null;
    }

    $contents = file_get_contents($file);

    if ($contents === false || trim($contents) === '') {
        return null;
    }

    $data = json_decode($contents, true);

    return is_array($data) ? $data : null;
}

function playerDetailsWriteCache(string $file, array $data): void
{
    $contents = json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    if (
        $contents === false ||
        file_put_contents($file, $contents, LOCK_EX) === false
    ) {
        error_log('Flow player-details cache write failed: ' . $file);
    }
}

function playerDetailsRequest(string $endpoint, array $params = []): array
{
    $query = http_build_query($params);

    $url = rtrim(API_FOOTBALL_BASE_URL, '/') .
        '/' .
        ltrim($endpoint, '/');

    if ($query !== '') {
        $url .= '?' . $query;
    }

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
        throw new RuntimeException('API-Football atgrieza nederīgu JSON.');
    }

    if ($status < 200 || $status >= 300) {
        throw new RuntimeException(
            'API-Football atgrieza HTTP ' . $status . '.'
        );
    }

    if (isset($decoded['errors']) && $decoded['errors'] !== []) {
        throw new RuntimeException(
            'API-Football ziņoja par pieprasījuma kļūdu.'
        );
    }

    return $decoded;
}

function playerDetailsRespondError(int $status, string $message): never
{
    http_response_code($status);

    echo json_encode([
        'success' => false,
        'error' => $message,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    exit;
}

function playerDetailsFetchMain(
    string $cacheFile,
    int $playerId,
    string $season,
    ?int $league
): array {
    $cached = playerDetailsReadCache($cacheFile);

    if ($cached !== null) {
        return [
            'data' => $cached,
            'cached' => true,
            'stale' => false,
        ];
    }

    $lock = acquireCacheRefreshLock($cacheFile);

    if ($lock !== null) {
        $cached = playerDetailsReadCache($cacheFile);

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
        $params = [
            'id' => $playerId,
            'season' => $season,
        ];

        if ($league !== null && $league > 0) {
            $params['league'] = $league;
        }

        $data = playerDetailsRequest('players', $params);

        playerDetailsWriteCache($cacheFile, $data);

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
            'Flow player-details main request failed: ' .
            $error->getMessage()
        );

        $stale = playerDetailsReadCache($cacheFile, true);

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

try {
    $main = playerDetailsFetchMain(
        $cacheFile,
        $playerId,
        $season,
        $league ?: null
    );
} catch (Throwable $error) {
    playerDetailsRespondError(
        502,
        'Neizdevās iegūt spēlētāja pamatdatus. Mēģini vēlāk.'
    );
}

$playerRows = $main['data']['response'] ?? [];

if (!is_array($playerRows) || $playerRows === []) {
    playerDetailsRespondError(
        404,
        'Spēlētājs nav atrasts vai API nav atgriezis spēlētāja datus.'
    );
}

$player = $playerRows[0] ?? null;

if (!is_array($player)) {
    playerDetailsRespondError(
        502,
        'API-Football atgrieza nederīgus spēlētāja datus.'
    );
}

$warnings = [];
$optional = [];

$optionalRequests = [
    'trophies' => [
        'endpoint' => 'trophies',
        'params' => [
            'player' => $playerId,
        ],
    ],
];

foreach ($optionalRequests as $key => $request) {
    try {
        $optional[$key] = playerDetailsRequest(
            $request['endpoint'],
            $request['params']
        );
    } catch (Throwable $error) {
        error_log(
            'Flow player-details optional section failed (' .
            $key . '): ' . $error->getMessage()
        );

        $optional[$key] = [
            'response' => [],
        ];

        $warnings[] = [
            'section' => $key,
            'message' => 'Šo informācijas sadaļu pašlaik neizdevās ielādēt.',
        ];
    }
}

echo json_encode([
    'success' => true,
    'player' => $player,
    'trophies' => $optional['trophies']['response'] ?? [],
    'warnings' => $warnings,
    'cached' => $main['cached'],
    'stale' => $main['stale'],
    'source' => 'api-football',
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
