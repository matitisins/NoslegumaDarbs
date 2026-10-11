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
    'fpl',
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_FPL_REQUESTS
);

$allowedEndpoints = [
    'bootstrap-static',
    'fixtures',
    'element-summary',
];

$endpoint = trim((string)($_GET['endpoint'] ?? 'bootstrap-static'));

if (!in_array($endpoint, $allowedEndpoints, true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Neatbalstīts FPL API endpoint.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$playerId = null;

if ($endpoint === 'element-summary') {
    $playerId = filter_input(INPUT_GET, 'player', FILTER_VALIDATE_INT);

    if (!$playerId || $playerId < 1) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Spēlētāja detaļām nepieciešams derīgs player ID.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

$baseUrl = 'https://fantasy.premierleague.com/api';

$url = rtrim($baseUrl, '/') . '/' . $endpoint . '/';

if ($playerId !== null) {
    $url = rtrim($baseUrl, '/') .
        '/element-summary/' .
        $playerId .
        '/';
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
    error_log('Flow FPL cache directory could not be created.');
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'error' => 'Kešatmiņa īslaicīgi nav pieejama.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$cacheKey = $endpoint;

if ($playerId !== null) {
    $cacheKey .= '_' . $playerId;
}

$cacheFile =
    $cacheDirectory .
    DIRECTORY_SEPARATOR .
    'fpl_' .
    hash('sha256', $cacheKey) .
    '.json';

function fplReadCache(
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
        time() - $modified > CACHE_TTL_FPL
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

function fplWriteCache(string $file, array $data): void
{
    $contents = json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    if (
        $contents === false ||
        file_put_contents($file, $contents, LOCK_EX) === false
    ) {
        error_log('Flow FPL cache write failed: ' . $file);
    }
}

function fplRequest(string $url): array
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
        throw new RuntimeException('FPL atgrieza nederīgu JSON atbildi.');
    }

    return [
        'status' => $status,
        'data' => $decoded,
    ];
}

function fplRespondError(int $status, string $message): never
{
    http_response_code($status);

    echo json_encode([
        'success' => false,
        'error' => $message,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    exit;
}

$cached = fplReadCache($cacheFile);

if ($cached !== null) {
    echo json_encode([
        'success' => true,
        'data' => $cached,
        'cached' => true,
        'stale' => false,
        'source' => 'official-fpl',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$cacheLock = acquireCacheRefreshLock($cacheFile);

if ($cacheLock !== null) {
    $cached = fplReadCache($cacheFile);

    if ($cached !== null) {
        releaseCacheRefreshLock($cacheLock);

        echo json_encode([
            'success' => true,
            'data' => $cached,
            'cached' => true,
            'stale' => false,
            'source' => 'official-fpl',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

try {
    $response = fplRequest($url);

    if (
        $response['status'] < 200 ||
        $response['status'] >= 300
    ) {
        throw new RuntimeException(
            'FPL atgrieza HTTP ' . $response['status'] . '.'
        );
    }

    fplWriteCache($cacheFile, $response['data']);

    if ($cacheLock !== null) {
        releaseCacheRefreshLock($cacheLock);
    }

    echo json_encode([
        'success' => true,
        'data' => $response['data'],
        'cached' => false,
        'stale' => false,
        'source' => 'official-fpl',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    if ($cacheLock !== null) {
        releaseCacheRefreshLock($cacheLock);
    }

    error_log(
        'Flow FPL request failed: ' .
        $error->getMessage()
    );

    $stale = fplReadCache($cacheFile, true);

    if ($stale !== null) {
        echo json_encode([
            'success' => true,
            'data' => $stale,
            'cached' => true,
            'stale' => true,
            'warning' => 'FPL dati pašlaik nav atjaunojami; tiek izmantota iepriekš saglabāta informācija.',
            'source' => 'official-fpl',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    fplRespondError(
        502,
        'Neizdevās iegūt datus no oficiālā FPL API. Mēģini vēlāk.'
    );
}
