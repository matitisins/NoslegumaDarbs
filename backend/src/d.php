<?php

declare(strict_types=1);

/**
 * Simple .env loader.
 *
 * Reads:
 *     backend/.env
 *
 * and makes variables available through:
 *     getenv()
 *     $_ENV
 *     $_SERVER
 */

function loadEnvironmentFile(string $filePath): void
{
    if (!is_file($filePath)) {
        return;
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        // Ignore empty lines.
        if ($line === '') {
            continue;
        }

        // Ignore comments.
        if (str_starts_with($line, '#')) {
            continue;
        }

        // Find the first "=".
        $separatorPosition = strpos($line, '=');

        if ($separatorPosition === false) {
            continue;
        }

        $name = trim(
            substr($line, 0, $separatorPosition)
        );

        $value = trim(
            substr($line, $separatorPosition + 1)
        );

        if ($name === '') {
            continue;
        }

        // Remove matching quotes.
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

        // Do not overwrite an existing server environment variable.
        if (getenv($name) !== false) {
            continue;
        }

        putenv($name . '=' . $value);

        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
}

/**
 * The .env file is two directories above this file:
 *
 * backend/src/api/d.php
 *       ↑
 *       src/api
 *
 * -> backend/.env
 */
$envFile = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env';

loadEnvironmentFile($envFile);