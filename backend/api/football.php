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
    'football-data',
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_FOOTBALL_DATA_REQUESTS
);

if (FOOTBALL_DATA_API_TOKEN === '') {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Servera vides mainīgais FOOTBALL_DATA_API_TOKEN nav konfigurēts backend/.env failā.',
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

function footballRequest(string $url): array
{
    $curl = curl_init($url);

    if ($curl === false) {
        throw new RuntimeException('Neizdevās inicializēt cURL.');
    }

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            'X-Auth-Token: ' . FOOTBALL_DATA_API_TOKEN,
            'Accept: application/json',
        ],
        CURLOPT_USERAGENT => 'Flow Football Analytics',
    ]);

    $body = curl_exec($curl);
    $error = curl_error($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);

    if ($body === false) {
        throw new RuntimeException(
            $error !== '' ? $error : 'Nezināma cURL kļūda.'
        );
    }

    return [
        'status' => $status,
        'body' => $body,
    ];
}

function footballCacheFile(string $directory, string $name): string
{
    return $directory .
        DIRECTORY_SEPARATOR .
        $name .
        '.json';
}

function footballReadCache(
    string $file,
    bool $allowStale = false,
    int $maxAge = CACHE_TTL_FOOTBALL_DATA
): ?array {
    if (!is_file($file)) {
        return null;
    }

    $modified = filemtime($file);

    if ($modified === false) {
        return null;
    }

    if (!$allowStale && time() - $modified > $maxAge) {
        return null;
    }

    $content = file_get_contents($file);

    if ($content === false || trim($content) === '') {
        return null;
    }

    $data = json_decode($content, true);

    return is_array($data) ? $data : null;
}

function footballWriteCache(string $file, array $data): void
{
    $json = json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    if (
        $json === false ||
        file_put_contents($file, $json, LOCK_EX) === false
    ) {
        error_log('Flow football-data cache write failed: ' . $file);
    }
}

function sendFootballError(int $status, string $message): never
{
    http_response_code($status);

    echo json_encode([
        'success' => false,
        'error' => $message,
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
    error_log(
        'Flow football-data cache directory could not be created: ' .
        $cacheDirectory
    );
}

$base = rtrim(FOOTBALL_DATA_BASE_URL, '/');
$competitionEncoded = rawurlencode($competition);
$seasonEncoded = rawurlencode($season);
$cacheAge = CACHE_TTL_FOOTBALL_DATA;

$requests = [
    'scorers' => [
        $base .
            '/competitions/' .
            $competitionEncoded .
            '/scorers?season=' .
            $seasonEncoded .
            '&limit=100',
        footballCacheFile(
            $cacheDirectory,
            'scorers_' . $competition . '_' . $season
        ),
    ],
    'teams' => [
        $base .
            '/competitions/' .
            $competitionEncoded .
            '/teams?season=' .
            $seasonEncoded,
        footballCacheFile(
            $cacheDirectory,
            'teams_' . $competition . '_' . $season
        ),
    ],
    'standings' => [
        $base .
            '/competitions/' .
            $competitionEncoded .
            '/standings?season=' .
            $seasonEncoded,
        footballCacheFile(
            $cacheDirectory,
            'standings_' . $competition . '_' . $season
        ),
    ],
];

$results = [];
$usedCache = false;
$usedStaleCache = false;

foreach ($requests as $name => [$url, $file]) {
    $cached = footballReadCache($file, false, $cacheAge);

    if ($cached !== null) {
        $results[$name] = $cached;
        $usedCache = true;
        continue;
    }

    $cacheLock = acquireCacheRefreshLock($file);

    if ($cacheLock !== null) {
        $cached = footballReadCache($file, false, $cacheAge);

        if ($cached !== null) {
            $results[$name] = $cached;
            $usedCache = true;

            releaseCacheRefreshLock($cacheLock);
            continue;
        }
    }

    try {
        $response = footballRequest($url);

        if (
            $response['status'] < 200 ||
            $response['status'] >= 300
        ) {
            error_log(
                'Flow football-data request failed for ' .
                $name .
                ': upstream HTTP ' .
                (int)$response['status']
            );

            $stale = footballReadCache($file, true);

            if ($stale !== null) {
                $results[$name] = $stale;
                $usedCache = true;
                $usedStaleCache = true;

                if ($cacheLock !== null) {
                    releaseCacheRefreshLock($cacheLock);
                }

                continue;
            }

            $status = (int)$response['status'];

            if ($status === 401) {
                sendFootballError(
                    502,
                    'Football-data.org noraidīja API tokenu. Pārbaudi servera konfigurāciju.'
                );
            }

            if ($status === 403) {
                sendFootballError(
                    502,
                    'Football-data.org neatļāva pieprasījumu. Pārbaudi API plāna piekļuves tiesības.'
                );
            }

            if ($status === 404) {
                sendFootballError(
                    404,
                    'Football-data.org neatrada pieprasīto līgu vai sezonas datus.'
                );
            }

            if ($status === 429) {
                sendFootballError(
                    429,
                    'Football-data.org API limits ir sasniegts. Uzgaidi un mēģini vēlreiz.'
                );
            }

            sendFootballError(
                502,
                'Football-data.org atgrieza HTTP ' . $status . '.'
            );
        }

        $decoded = json_decode($response['body'], true);

        if (!is_array($decoded)) {
            $stale = footballReadCache($file, true);

            if ($stale !== null) {
                $results[$name] = $stale;
                $usedCache = true;
                $usedStaleCache = true;

                if ($cacheLock !== null) {
                    releaseCacheRefreshLock($cacheLock);
                }

                continue;
            }

            sendFootballError(
                502,
                'Football-data.org atgrieza nederīgu JSON atbildi.'
            );
        }

        $results[$name] = $decoded;

        footballWriteCache($file, $decoded);

        if ($cacheLock !== null) {
            releaseCacheRefreshLock($cacheLock);
        }
    } catch (Throwable $error) {
        if ($cacheLock !== null) {
            releaseCacheRefreshLock($cacheLock);
        }

        error_log(
            'Flow football-data request failed for ' .
            $name .
            ': ' .
            $error->getMessage()
        );

        $stale = footballReadCache($file, true);

        if ($stale !== null) {
            $results[$name] = $stale;
            $usedCache = true;
            $usedStaleCache = true;
            continue;
        }

        sendFootballError(
            502,
            'Neizdevās iegūt datus no Football-data.org. Mēģini vēlāk.'
        );
    }
}

$scorers = is_array(
    $results['scorers']['scorers'] ?? null
)
    ? $results['scorers']['scorers']
    : [];

$teams = is_array(
    $results['teams']['teams'] ?? null
)
    ? $results['teams']['teams']
    : [];

$standings = [];

foreach (($results['standings']['standings'] ?? []) as $standing) {
    if (
        !is_array($standing) ||
        !is_array($standing['table'] ?? null)
    ) {
        continue;
    }

    if (strtoupper((string)($standing['type'] ?? '')) === 'TOTAL') {
        $standings = $standing['table'];
        break;
    }
}

if (!$standings) {
    foreach (($results['standings']['standings'] ?? []) as $standing) {
        if (
            is_array($standing) &&
            is_array($standing['table'] ?? null)
        ) {
            $standings = $standing['table'];
            break;
        }
    }
}

echo json_encode([
    'success' => true,
    'competition' => $competition,
    'season' => (int)$season,
    'count' => count($scorers),
    'scorers' => $scorers,
    'teams' => $teams,
    'standings' => $standings,
    'source' => 'football-data.org',
    'cached' => $usedCache,
    'stale' => $usedStaleCache,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
