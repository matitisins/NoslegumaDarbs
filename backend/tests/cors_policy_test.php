<?php

declare(strict_types=1);

/**
 * Regression tests for the shared CORS policy and endpoint wiring.
 *
 * Run from the project root:
 *   php backend/tests/cors_policy_test.php
 */

$testDirectory = __DIR__;
$backendRoot = dirname($testDirectory);
$configPath = $backendRoot . DIRECTORY_SEPARATOR . 'src'
    . DIRECTORY_SEPARATOR . 'api'
    . DIRECTORY_SEPARATOR . 'config.php';

if (!is_file($configPath)) {
    fwrite(STDERR, "FAIL: central backend config was not found: {$configPath}\n");
    exit(1);
}

require_once $configPath;

$failures = 0;
$checks = 0;

function corsTest(bool $condition, string $message): void
{
    global $failures, $checks;
    $checks++;

    if ($condition) {
        echo "PASS: {$message}\n";
        return;
    }

    $failures++;
    echo "FAIL: {$message}\n";
}

$allowed = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://example.test',
];

corsTest(
    isCorsOriginAllowed('https://example.test', $allowed),
    'allows an explicitly configured origin'
);

corsTest(
    !isCorsOriginAllowed('https://attacker.example', $allowed),
    'rejects an origin that is not on the allowlist'
);

corsTest(
    isCorsOriginAllowed('', $allowed),
    'does not block requests that omit the Origin header'
);

corsTest(
    isCorsOriginAllowed(
        'http://localhost:8080',
        $allowed,
        'http://localhost:8080'
    ),
    'allows a same-origin request'
);

corsTest(
    !isCorsOriginAllowed(
        'https://attacker.example',
        $allowed,
        'https://app.example'
    ),
    'rejects an unlisted cross-origin request'
);

/*
 * Resolve endpoints from the backend root derived from __DIR__, avoiding
 * assumptions about the current working directory when PHP is invoked.
 */
$endpoints = [
    'api/football.php',
    'api/api-football.php',
    'api/fpl.php',
    'api/league-data.php',
    'api/player-details.php',
];

foreach ($endpoints as $relativePath) {
    $path = $backendRoot . DIRECTORY_SEPARATOR
        . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);

    if (!is_file($path)) {
        corsTest(false, "{$relativePath} exists at {$path}");
        continue;
    }

    $source = file_get_contents($path);

    corsTest(
        is_string($source) && str_contains($source, "require_once __DIR__ . '/../src/api/config.php';"),
        "{$relativePath} loads the central API configuration"
    );

    corsTest(
        is_string($source) && str_contains($source, 'enforceCorsPolicy();'),
        "{$relativePath} calls enforceCorsPolicy()"
    );

    corsTest(
        is_string($source) && !preg_match(
            '/Access-Control-Allow-Origin\s*:\s*\*/i',
            $source
        ),
        "{$relativePath} does not set a wildcard CORS origin"
    );
}

$envExamplePath = $backendRoot . DIRECTORY_SEPARATOR . '.env.example';
$envExample = is_file($envExamplePath)
    ? file_get_contents($envExamplePath)
    : false;

corsTest(
    is_string($envExample) && str_contains($envExample, 'CORS_ALLOWED_ORIGINS='),
    'backend/.env.example documents CORS_ALLOWED_ORIGINS'
);

if (is_string($envExample)) {
    corsTest(
        (bool) preg_match('/^FOOTBALL_DATA_API_TOKEN\s*=\s*$/m', $envExample),
        'example Football-data token is blank'
    );

    corsTest(
        (bool) preg_match('/^API_FOOTBALL_KEY\s*=\s*$/m', $envExample),
        'example API-Football key is blank'
    );
}

echo "\n{$checks} checks run; {$failures} failure(s).\n";
exit($failures === 0 ? 0 : 1);