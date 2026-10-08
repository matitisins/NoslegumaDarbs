<?php

/*
 * Centrālā backend konfigurācija.
 *
 * API atslēgas tiek nolasītas tikai no servera vides mainīgajiem vai
 * lokālā backend/.env faila. Šis fails nekad neizvada atslēgas klientam.
 * Visi PHP API endpointi ielādē šo konfigurāciju, tādēļ kopīgā validācija
 * un pieprasījumu ierobežošana tiek veikta vienā vietā.
 */

declare(strict_types=1);

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
    'RATE_LIMIT_REQUESTS_PER_MINUTE',
    max(
        30,
        (int)(
            getenv(
                'RATE_LIMIT_REQUESTS_PER_MINUTE'
            ) ?: 180
        )
    )
);

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

    $windowSeconds = max(1, $windowSeconds);

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
        /*
         * Ja rate-limit direktoriju nevar izveidot,
         * API joprojām drīkst darboties.
         *
         * Šī situācija jārisina servera konfigurācijā.
         */
        return;
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
        return;
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            return;
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

            header(
                'Retry-After: 60'
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

enforceRateLimit();