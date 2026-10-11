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
    'league-data',
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_LEAGUE_DATA_REQUESTS
);

if (FOOTBALL_DATA_API_TOKEN === '') {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Servera vides mainīgais FOOTBALL_DATA_API_TOKEN nav konfigurēts.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$allowedCompetitions = ['PL', 'PD', 'SA', 'BL1', 'FL1'];

$competition = strtoupper(
    trim((string)($_GET['competition'] ?? 'PL'))
);

$season = trim(
    (string)($_GET['season'] ?? '2026')
);

$type = strtolower(
    trim((string)($_GET['type'] ?? 'standings'))
);

if (!in_array($competition, $allowedCompetitions, true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Neatbalstīta līga.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!preg_match('/^\d{4}$/', $season)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Sezonai jābūt četrciparu gadam.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!in_array($type, ['standings', 'fixtures'], true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Neatbalstīts datu tips. Atļauts standings vai fixtures.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$baseUrl = rtrim(FOOTBALL_DATA_BASE_URL, '/');

if ($type === 'standings') {
    $endpoint = '/competitions/' .
        rawurlencode($competition) .
        '/standings?season=' .
        rawurlencode($season);

    $ttl = CACHE_TTL_LEAGUE_STANDINGS;
} else {
    $endpoint = '/competitions/' .
        rawurlencode($competition) .
        '/matches?season=' .
        rawurlencode($season);

    $ttl = CACHE_TTL_LEAGUE_FIXTURES;
}

$url = $baseUrl . $endpoint;

$cacheDirectory =
    dirname(__DIR__) .
    DIRECTORY_SEPARATOR .
    'cache';

if (
    !is_dir($cacheDirectory) &&
    !mkdir($cacheDirectory, 0775, true) &&
    !is_dir($cacheDirectory)
) {
    error_log('Flow league-data cache directory could not be created.');

    http_response_code(503);
    echo json_encode([
        'success' => false,
        'error' => 'Kešatmiņa īslaicīgi nav pieejama.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$cacheKey = $type . '_' . $competition . '_' . $season;

$cacheFile =
    $cacheDirectory .
    DIRECTORY_SEPARATOR .
    'league_' .
    hash('sha256', $cacheKey) .
    '.json';

function leagueDataReadCache(
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

function leagueDataWriteCache(string $file, array $data): void
{
    $contents = json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    if (
        $contents === false ||
        file_put_contents($file, $contents, LOCK_EX) === false
    ) {
        error_log('Flow league-data cache write failed: ' . $file);
    }
}

function leagueDataRequest(string $url): array
{
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
            'X-Auth-Token: ' . FOOTBALL_DATA_API_TOKEN,
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
            'Football-data.org atgrieza nederīgu JSON atbildi.'
        );
    }

    return [
        'status' => $status,
        'data' => $decoded,
    ];
}

function leagueDataRespondError(int $status, string $message): never
{
    http_response_code($status);

    echo json_encode([
        'success' => false,
        'error' => $message,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    exit;
}

$cached = leagueDataReadCache($cacheFile, $ttl);

if ($cached !== null) {
    echo json_encode([
        'success' => true,
        'data' => $cached,
        'type' => $type,
        'competition' => $competition,
        'season' => (int)$season,
        'cached' => true,
        'stale' => false,
        'source' => 'football-data.org',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$cacheLock = acquireCacheRefreshLock($cacheFile);

if ($cacheLock !== null) {
    $cached = leagueDataReadCache($cacheFile, $ttl);

    if ($cached !== null) {
        releaseCacheRefreshLock($cacheLock);

        echo json_encode([
            'success' => true,
            'data' => $cached,
            'type' => $type,
            'competition' => $competition,
            'season' => (int)$season,
            'cached' => true,
            'stale' => false,
            'source' => 'football-data.org',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

try {
    $response = leagueDataRequest($url);

    if (
        $response['status'] < 200 ||
        $response['status'] >= 300
    ) {
        throw new RuntimeException(
            'Football-data.org atgrieza HTTP ' .
            $response['status'] . '.'
        );
    }

    leagueDataWriteCache($cacheFile, $response['data']);

    if ($cacheLock !== null) {
        releaseCacheRefreshLock($cacheLock);
    }

    echo json_encode([
        'success' => true,
        'data' => $response['data'],
        'type' => $type,
        'competition' => $competition,
        'season' => (int)$season,
        'cached' => false,
        'stale' => false,
        'source' => 'football-data.org',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    if ($cacheLock !== null) {
        releaseCacheRefreshLock($cacheLock);
    }

    error_log(
        'Flow league-data request failed: ' .
        $error->getMessage()
    );

    $stale = leagueDataReadCache($cacheFile, $ttl, true);

    if ($stale !== null) {
        echo json_encode([
            'success' => true,
            'data' => $stale,
            'type' => $type,
            'competition' => $competition,
            'season' => (int)$season,
            'cached' => true,
            'stale' => true,
            'warning' => 'Līgas dati pašlaik nav atjaunojami; tiek izmantota iepriekš saglabāta informācija.',
            'source' => 'football-data.org',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    leagueDataRespondError(
        502,
        'Neizdevās iegūt līgas datus no Football-data.org. Mēģini vēlāk.'
    );
}
