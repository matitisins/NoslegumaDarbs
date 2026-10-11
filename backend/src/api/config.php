<?php

declare(strict_types=1);


/*
 * Centrālā backend konfigurācija.
 *
 * API atslēgas tiek nolasītas tikai no servera vides mainīgajiem vai
 * lokālā backend/.env faila. Šis fails nekad neizvada atslēgas klientam.
 * Visi PHP API endpointi ielādē šo konfigurāciju, tādēļ kopīgā validācija
 * un pieprasījumu ierobežošana tiek veikta vienā vietā.
 */


function loadEnvFile(string $file): void
{
    if (!is_file($file)) {
        return;
    }

    $lines = file(
        $file,
        FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES
    );

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (!str_contains($line, '=')) {
            continue;
        }

        [$name, $value] = explode('=', $line, 2);

        $name = trim($name);
        $value = trim($value);

        if (
            strlen($value) >= 2 &&
            (
                (
                    $value[0] === '"' &&
                    $value[strlen($value) - 1] === '"'
                ) ||
                (
                    $value[0] === "'" &&
                    $value[strlen($value) - 1] === "'"
                )
            )
        ) {
            $value = substr($value, 1, -1);
        }

        // Servera vides mainīgajam vienmēr ir prioritāte pār .env failu.
        if (
            $name !== '' &&
            getenv($name) === false
        ) {
            putenv($name . '=' . $value);
        }
    }
}

$projectRoot = dirname(__DIR__, 2);

$envFile =
    $projectRoot .
    DIRECTORY_SEPARATOR .
    '.env';

loadEnvFile($envFile);

$corsOriginsRaw = getenv('CORS_ALLOWED_ORIGINS');
if ($corsOriginsRaw === false) {
    // Safe local-development defaults. Production deployments should set their own origins.
    $corsOriginsRaw = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173';
}

$corsOrigins = array_values(array_unique(array_filter(
    array_map('trim', explode(',', $corsOriginsRaw)),
    static fn(string $origin): bool => $origin !== ''
)));

define('CORS_ALLOWED_ORIGINS', $corsOrigins);

define(
    'FOOTBALL_DATA_API_TOKEN',
    trim(
        (string)(
            getenv('FOOTBALL_DATA_API_TOKEN') ?: ''
        )
    )
);

define(
    'API_FOOTBALL_KEY',
    trim(
        (string)(
            getenv('API_FOOTBALL_KEY') ?: ''
        )
    )
);

define(
    'FOOTBALL_DATA_BASE_URL',
    'https://api.football-data.org/v4'
);

define(
    'API_FOOTBALL_BASE_URL',
    'https://v3.football.api-sports.io'
);

define(
    'RATE_LIMIT_WINDOW_SECONDS',
    max(
        1,
        (int)(
            getenv('RATE_LIMIT_WINDOW_SECONDS') ?: 60
        )
    )
);

define(
    'RATE_LIMIT_REQUESTS_PER_MINUTE',
    max(
        1,
        (int)(
            getenv('RATE_LIMIT_REQUESTS_PER_MINUTE') ?: 180
        )
    )
);

define(
    'RATE_LIMIT_FOOTBALL_DATA_REQUESTS',
    max(
        1,
        (int)(
            getenv('RATE_LIMIT_FOOTBALL_DATA_REQUESTS') ?: 60
        )
    )
);

define(
    'RATE_LIMIT_API_FOOTBALL_REQUESTS',
    max(
        1,
        (int)(
            getenv('RATE_LIMIT_API_FOOTBALL_REQUESTS') ?: 60
        )
    )
);

define(
    'RATE_LIMIT_FPL_REQUESTS',
    max(
        1,
        (int)(
            getenv('RATE_LIMIT_FPL_REQUESTS') ?: 60
        )
    )
);

define(
    'RATE_LIMIT_LEAGUE_DATA_REQUESTS',
    max(
        1,
        (int)(
            getenv('RATE_LIMIT_LEAGUE_DATA_REQUESTS') ?: 60
        )
    )
);

define(
    'RATE_LIMIT_PLAYER_DETAILS_REQUESTS',
    max(
        1,
        (int)(
            getenv('RATE_LIMIT_PLAYER_DETAILS_REQUESTS') ?: 60
        )
    )
);

/*
 * Rate limiting politika ir endpoint-specific, lai viens intensīvs
 * pieprasījumu tips nevarētu izmantot visu citu endpointu limitu.
 *
 * Visi publiskie API endpointi izmanto vienu minūtes logu un 60
 * pieprasījumus uz klienta IP pēc noklusējuma. Vērtības var mainīt
 * servera .env failā, nepārrakstot PHP kodu.
 *
 * RATE_LIMIT_REQUESTS_PER_MINUTE ir drošs noklusējuma limits tikai
 * gadījumiem, kad enforceRateLimit() tiek izmantots bez endpoint-specific
 * limita. Paši publiskie endpointi izmanto savas RATE_LIMIT_*_REQUESTS
 * konstantes.
 */

/*
 * Kešatmiņas TTL vērtības.
 *
 * Īsāks TTL tiek izmantots datiem, kas var mainīties bieži (piemēram,
 * gaidāmās/pēdējās spēles), bet ilgāks TTL — datiem, kas mainās retāk
 * (piemēram, detalizēta spēlētāja statistika).
 *
 * TTL ir centralizēti vienā vietā, lai endpointiem nebūtu atšķirīgu
 * "maģisko" skaitļu un kešatmiņas politika būtu viegli pārskatāma.
 */
define('CACHE_TTL_FOOTBALL_DATA', 30 * 60);
define('CACHE_TTL_API_FOOTBALL_TEAMS', 30 * 60);
define('CACHE_TTL_API_FOOTBALL_TEAM_STATS', 30 * 60);
define('CACHE_TTL_API_FOOTBALL_H2H', 60 * 60);
define('CACHE_TTL_API_FOOTBALL_FDR', 15 * 60);
define('CACHE_TTL_API_FOOTBALL_PLAYERS', 30 * 60);
define('CACHE_TTL_LEAGUE_STANDINGS', 15 * 60);
define('CACHE_TTL_LEAGUE_FIXTURES', 5 * 60);
define('CACHE_TTL_FPL', 30 * 60);
define('CACHE_TTL_PLAYER_DETAILS', 6 * 60 * 60);

/**
 * Pārbauda CORS izcelsmi pret precīzu allowlist vai pašreizējo origin.
 * CORS nav autentifikācija; tas tikai ierobežo pārlūka cross-origin piekļuvi.
 */
function isCorsOriginAllowed(string $origin, array $allowedOrigins, string $requestOrigin = ''): bool
{
    if ($origin === '') {
        return true;
    }

    if ($requestOrigin !== '' && hash_equals($requestOrigin, $origin)) {
        return true;
    }

    return in_array($origin, $allowedOrigins, true);
}

function getCurrentRequestOrigin(): string
{
    $host = trim((string)($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '' || preg_match('/[\r\n]/', $host)) {
        return '';
    }

    $https = strtolower((string)($_SERVER['HTTPS'] ?? ''));
    $scheme = ($https !== '' && $https !== 'off' && $https !== '0') ? 'https' : 'http';
    return $scheme . '://' . $host;
}

/**
 * Atļauj tikai konfigurētus cross-origin pieprasījumus.
 * Same-origin pieprasījumiem CORS nav nepieciešams, bet tie netiek bloķēti.
 */
function enforceCorsPolicy(): void
{
    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    $requestOrigin = getCurrentRequestOrigin();

    if (!isCorsOriginAllowed($origin, CORS_ALLOWED_ORIGINS, $requestOrigin)) {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(
            ['success' => false, 'error' => 'Šī pieprasījuma izcelsme nav atļauta.'],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
        exit;
    }

    if ($origin === '') {
        return;
    }

    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
}

/**
 * Atgriež klienta adresi bez uzticēšanās
 * X-Forwarded-For galvenei.
 *
 * Tas novērš vienkāršu rate-limit apiešanu
 * ar viltotu HTTP galveni.
 */
function getClientAddress(): string
{
    $address =
        $_SERVER['REMOTE_ADDR'] ??
        'unknown';

    return filter_var(
        $address,
        FILTER_VALIDATE_IP
    )
        ? $address
        : 'unknown';
}

/**
 * Atgriež drošu kļūdu, ja rate-limit stāvokli nevar saglabāt.
 *
 * Šādā gadījumā pieprasījums netiek izlaists bez aizsardzības, jo tas
 * varētu ļaut neierobežoti izmantot ārējo API pat tad, ja lokālā
 * rate-limit kešatmiņa nav pieejama.
 */
function sendRateLimitStorageError(): void
{
    http_response_code(503);
    header('Retry-After: 60');

    echo json_encode(
        [
            'success' => false,
            'error' => 'Pieprasījumu ierobežošanas serviss īslaicīgi nav pieejams.',
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

/**
 * Vienkāršs failu bāzēts rate limiter publiskajiem
 * GET endpointiem.
 *
 * Limits tiek piemērots katram klienta IP atsevišķi
 * vienas minūtes logā.
 */
function enforceRateLimit(
    string $endpoint = 'api',
    int $windowSeconds = 60,
    ?int $maxRequests = null
): void
{
    $endpoint = trim($endpoint) !== ''
        ? trim($endpoint)
        : 'api';

    $windowSeconds = $windowSeconds > 0
        ? $windowSeconds
        : RATE_LIMIT_WINDOW_SECONDS;

    $maxRequests = $maxRequests !== null
        ? max(1, $maxRequests)
        : RATE_LIMIT_REQUESTS_PER_MINUTE;
    $directory =
        dirname(__DIR__, 2) .
        DIRECTORY_SEPARATOR .
        'cache' .
        DIRECTORY_SEPARATOR .
        'rate-limit';

    if (
        !is_dir($directory) &&
        !mkdir($directory, 0775, true) &&
        !is_dir($directory)
    ) {
        sendRateLimitStorageError();
    }

    $window =
        (int)floor(
            time() / $windowSeconds
        );

    $key = hash(
        'sha256',
        getClientAddress() .
        '|' .
        $endpoint
    );

    $file =
        $directory .
        DIRECTORY_SEPARATOR .
        $key .
        '.json';

    $handle =
        fopen(
            $file,
            'c+'
        );

    if ($handle === false) {
        sendRateLimitStorageError();
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            sendRateLimitStorageError();
        }

        $contents =
            stream_get_contents($handle);

        $state =
            is_string($contents) &&
            trim($contents) !== ''
                ? json_decode(
                    $contents,
                    true
                )
                : null;

        if (
            !is_array($state) ||
            (int)(
                $state['window'] ?? -1
            ) !== $window
        ) {
            $state = [
                'window' => $window,
                'count' => 0,
            ];
        }

        $state['count'] =
            (int)(
                $state['count'] ?? 0
            ) + 1;

        ftruncate(
            $handle,
            0
        );

        rewind($handle);

        fwrite(
            $handle,
            json_encode(
                $state,
                JSON_UNESCAPED_SLASHES
            )
        );

        fflush($handle);

        if (
            $state['count'] >
            $maxRequests
        ) {
            http_response_code(429);

            $secondsIntoWindow = time() % $windowSeconds;
            $retryAfter = max(1, $windowSeconds - $secondsIntoWindow);

            header(
                'Retry-After: ' . $retryAfter
            );

            echo json_encode(
                [
                    'success' => false,
                    'error' =>
                        'Pārāk daudz pieprasījumu. Lūdzu, mēģini vēlreiz pēc brīža.',
                ],
                JSON_UNESCAPED_UNICODE |
                JSON_UNESCAPED_SLASHES
            );

            exit;
        }
    } finally {
        flock(
            $handle,
            LOCK_UN
        );

        fclose($handle);
    }
}

/**
 * Iegūst ekskluzīvu slēdzeni konkrēta cache ieraksta atjaunošanai.
 *
 * Cache miss gadījumā visi paralēlie pieprasījumi gaida uz šo lock.
 * Pēc lock iegūšanas endpointam jāveic atkārtota cache pārbaude.
 * Tādējādi tikai pirmais pieprasījums izsauc ārējo API.
 */
function acquireCacheRefreshLock(string $cacheFile)
{
    $lockFile = $cacheFile . '.lock';
    $handle = fopen($lockFile, 'c');

    if ($handle === false) {
        error_log('Flow cache lock could not be opened: ' . $lockFile);
        return null;
    }

    if (!flock($handle, LOCK_EX)) {
        fclose($handle);
        error_log('Flow cache lock could not be acquired: ' . $lockFile);
        return null;
    }

    return $handle;
}

function releaseCacheRefreshLock($handle): void
{
    if (is_resource($handle)) {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}