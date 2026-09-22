<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Environment loader
|--------------------------------------------------------------------------
*/

function loadEnvFile(string $file): array
{
    if (!file_exists($file)) {
        return [];
    }

    $lines = file(
        $file,
        FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES
    );

    if (!is_array($lines)) {
        return [];
    }

    $values = [];

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === '') {
            continue;
        }

        if (str_starts_with($line, '#')) {
            continue;
        }

        if (!str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);

        $key = trim($key);
        $value = trim($value);

        /*
         * Remove surrounding quotes if present.
         */
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
            $value = substr(
                $value,
                1,
                -1
            );
        }

        $values[$key] = $value;
    }

    return $values;
}


/*
|--------------------------------------------------------------------------
| Find backend/.env
|--------------------------------------------------------------------------
*/

$envPath = dirname(
    __DIR__,
    2
) . DIRECTORY_SEPARATOR . '.env';

$env = loadEnvFile($envPath);


/*
|--------------------------------------------------------------------------
| Football-data.org
|--------------------------------------------------------------------------
*/

$footballDataToken =
    $env['FOOTBALL_DATA_API_TOKEN']
    ?? getenv('FOOTBALL_DATA_API_TOKEN')
    ?? '';


/*
|--------------------------------------------------------------------------
| API-Football
|--------------------------------------------------------------------------
*/

$apiFootballKey =
    $env['API_FOOTBALL_KEY']
    ?? getenv('API_FOOTBALL_KEY')
    ?? '';


/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

define(
    'FOOTBALL_DATA_API_TOKEN',
    trim((string) $footballDataToken)
);

define(
    'FOOTBALL_DATA_API_BASE_URL',
    'https://api.football-data.org/v4'
);

define(
    'API_FOOTBALL_KEY',
    trim((string) $apiFootballKey)
);

define(
    'API_FOOTBALL_BASE_URL',
    'https://v3.football.api-sports.io'
);