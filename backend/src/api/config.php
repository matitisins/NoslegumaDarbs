<?php

/*
 * Ielādē projekta vides mainīgos no .env faila un nodrošina API
 * piekļuves atslēgas un API adrešu konfigurāciju pārējiem backend
 * failiem.
 */

declare(strict_types=1);

function loadEnvFile(string $file): void
{
    if (!is_file($file)) {
        return;
    }

    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

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
                ($value[0] === '"' && $value[strlen($value) - 1] === '"') ||
                ($value[0] === "'" && $value[strlen($value) - 1] === "'")
            )
        ) {
            $value = substr($value, 1, -1);
        }

        if ($name !== '' && getenv($name) === false) {
            putenv($name . '=' . $value);
        }
    }
}

$projectRoot = dirname(__DIR__, 2);
$envFile = $projectRoot . DIRECTORY_SEPARATOR . '.env';

loadEnvFile($envFile);

define(
    'FOOTBALL_DATA_API_TOKEN',
    (string) (getenv('FOOTBALL_DATA_API_TOKEN') ?: '')
);

define(
    'API_FOOTBALL_KEY',
    (string) (getenv('API_FOOTBALL_KEY') ?: '')
);

define(
    'FOOTBALL_DATA_BASE_URL',
    'https://api.football-data.org/v4'
);

define(
    'API_FOOTBALL_BASE_URL',
    'https://v3.football.api-sports.io'
);