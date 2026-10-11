<?php

declare(strict_types=1);

$testProjectRoot = dirname(__DIR__, 2);

require_once $testProjectRoot . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'config.php';

$expectedLimits = [
    'RATE_LIMIT_WINDOW_SECONDS' => 60,
    'RATE_LIMIT_FOOTBALL_DATA_REQUESTS' => 60,
    'RATE_LIMIT_API_FOOTBALL_REQUESTS' => 60,
    'RATE_LIMIT_FPL_REQUESTS' => 60,
    'RATE_LIMIT_LEAGUE_DATA_REQUESTS' => 60,
    'RATE_LIMIT_PLAYER_DETAILS_REQUESTS' => 60,
];

foreach ($expectedLimits as $name => $expected) {
    if (!defined($name) || constant($name) !== $expected) {
        throw new RuntimeException("FAIL: {$name} is not {$expected}.");
    }
}
$worker = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'flow-rate-limit-worker-' . bin2hex(random_bytes(6)) . '.php';

$configPath = $testProjectRoot . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'api' . DIRECTORY_SEPARATOR . 'config.php';
$workerSource = <<<'WORKER'
<?php

declare(strict_types=1);

$resultFile = $argv[1] ?? '';
$endpoint = $argv[2] ?? 'rate-limit-test';
$ip = $argv[3] ?? '198.51.100.10';
$maxRequests = (int)($argv[4] ?? 2);

$_SERVER['REMOTE_ADDR'] = $ip;
ob_start();

register_shutdown_function(static function () use ($resultFile): void {
    ob_end_clean();

    if ($resultFile === '') {
        return;
    }

    file_put_contents(
        $resultFile,
        json_encode(
            ['status' => http_response_code()],
            JSON_UNESCAPED_SLASHES
        )
    );
});

require_once '__CONFIG_PATH__';
enforceRateLimit($endpoint, 60, $maxRequests);

http_response_code(200);
WORKER;

file_put_contents($worker, str_replace('__CONFIG_PATH__', $configPath, $workerSource));

function runWorker(string $worker, string $resultFile, string $endpoint, string $ip, int $maxRequests): int
{
    $command = implode(' ', [
        escapeshellarg(PHP_BINARY),
        escapeshellarg($worker),
        escapeshellarg($resultFile),
        escapeshellarg($endpoint),
        escapeshellarg($ip),
        escapeshellarg((string)$maxRequests),
    ]);

    passthru($command, $exitCode);
    return $exitCode;
}

function readStatus(string $resultFile): int
{
    if (!is_file($resultFile)) {
        throw new RuntimeException('Rate-limit worker did not write a result.');
    }

    $data = json_decode((string)file_get_contents($resultFile), true);
    return (int)($data['status'] ?? 0);
}

$tests = [
    [
        'name' => 'same client is limited after the configured threshold',
        'endpoint' => 'rate-limit-threshold-' . bin2hex(random_bytes(4)),
        'ip' => '198.51.100.10',
        'max' => 2,
    ],
    [
        'name' => 'different endpoint gets its own bucket',
        'endpoint' => 'rate-limit-endpoint-' . bin2hex(random_bytes(4)),
        'ip' => '198.51.100.11',
        'max' => 1,
    ],
    [
        'name' => 'different client gets its own bucket',
        'endpoint' => 'rate-limit-client-' . bin2hex(random_bytes(4)),
        'ip' => '198.51.100.12',
        'max' => 1,
    ],
];

$createdRateLimitFiles = [];

try {
    foreach ($tests as $test) {
        $endpoint = $test['endpoint'];
        $ip = $test['ip'];
        $max = $test['max'];
        $resultBase = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'flow-rate-result-' . bin2hex(random_bytes(6));

        // First request must pass.
        $result = $resultBase . '-first.json';
        runWorker($worker, $result, $endpoint, $ip, $max);
        if (readStatus($result) !== 200) {
            throw new RuntimeException("FAIL: {$test['name']} - first request was not allowed.");
        }

        // Threshold request must still pass.
        if ($max > 1) {
            $result = $resultBase . '-threshold.json';
            runWorker($worker, $result, $endpoint, $ip, $max);
            if (readStatus($result) !== 200) {
                throw new RuntimeException("FAIL: {$test['name']} - threshold request was rejected.");
            }
        }

        // The next request must be rejected.
        $result = $resultBase . '-blocked.json';
        runWorker($worker, $result, $endpoint, $ip, $max);
        if (readStatus($result) !== 429) {
            throw new RuntimeException("FAIL: {$test['name']} - request above threshold was not rejected with 429.");
        }

        foreach (glob($resultBase . '-*.json') ?: [] as $resultFile) {
            @unlink($resultFile);
        }

        $createdRateLimitFiles[] = hash('sha256', $ip . '|' . $endpoint) . '.json';
    }

    // Explicitly verify endpoint isolation with the same IP.
    $endpointA = 'rate-limit-isolation-a-' . bin2hex(random_bytes(4));
    $endpointB = 'rate-limit-isolation-b-' . bin2hex(random_bytes(4));
    $ip = '198.51.100.13';

    $resultA = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'flow-rate-isolation-a-' . bin2hex(random_bytes(4)) . '.json';
    $resultB = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'flow-rate-isolation-b-' . bin2hex(random_bytes(4)) . '.json';

    runWorker($worker, $resultA, $endpointA, $ip, 1);
    if (readStatus($resultA) !== 200) {
        throw new RuntimeException('FAIL: endpoint isolation first request was rejected.');
    }

    runWorker($worker, $resultB, $endpointB, $ip, 1);
    if (readStatus($resultB) !== 200) {
        throw new RuntimeException('FAIL: endpoint isolation incorrectly shared a rate-limit bucket.');
    }

    $createdRateLimitFiles[] = hash('sha256', $ip . '|' . $endpointA) . '.json';
    $createdRateLimitFiles[] = hash('sha256', $ip . '|' . $endpointB) . '.json';
    @unlink($resultA);
    @unlink($resultB);

    echo "PASS: rate limiting enforces thresholds and isolates endpoint/client buckets.\n";
} finally {
    @unlink($worker);

    $rateLimitDirectory = $testProjectRoot . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR . 'rate-limit';
    foreach ($createdRateLimitFiles as $file) {
        @unlink($rateLimitDirectory . DIRECTORY_SEPARATOR . $file);
    }
}