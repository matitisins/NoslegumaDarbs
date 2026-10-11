<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/api/config.php';

if (($argv[1] ?? '') === '--worker') {
    $cacheFile = $argv[2] ?? '';
    $markerFile = $argv[3] ?? '';

    $lock = acquireCacheRefreshLock($cacheFile);

    if ($lock === null) {
        exit(2);
    }

    $fresh = is_file($cacheFile)
        && (time() - (int)filemtime($cacheFile)) < 60;

    if (!$fresh) {
        $count = is_file($markerFile)
            ? (int)trim((string)file_get_contents($markerFile))
            : 0;

        file_put_contents(
            $markerFile,
            (string)($count + 1),
            LOCK_EX
        );

        // Simulate the external API call while the refresh lock is held.
        usleep(250000);

        file_put_contents(
            $cacheFile,
            json_encode(['success' => true]),
            LOCK_EX
        );
    }

    releaseCacheRefreshLock($lock);
    exit(0);
}

$directory = sys_get_temp_dir()
    . DIRECTORY_SEPARATOR
    . 'flow-cache-lock-test';

if (
    !is_dir($directory) &&
    !mkdir($directory, 0775, true) &&
    !is_dir($directory)
) {
    fwrite(STDERR, "Unable to create test directory.\n");
    exit(1);
}

$cacheFile = $directory . DIRECTORY_SEPARATOR . 'same-key.json';
$markerFile = $directory . DIRECTORY_SEPARATOR . 'producer-count.txt';

@unlink($cacheFile);
@unlink($markerFile);

if (!function_exists('proc_open')) {
    echo "SKIPPED: proc_open is unavailable.\n";
    exit(0);
}

$php = PHP_BINARY;
$script = __FILE__;

$command =
    escapeshellarg($php) .
    ' ' .
    escapeshellarg($script) .
    ' --worker ' .
    escapeshellarg($cacheFile) .
    ' ' .
    escapeshellarg($markerFile);

$processes = [];

for ($i = 0; $i < 2; $i++) {
    $pipes = [];

    $process = proc_open(
        $command,
        [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ],
        $pipes
    );

    if (!is_resource($process)) {
        fwrite(STDERR, "Unable to start worker process.\n");
        exit(1);
    }

    fclose($pipes[0]);
    fclose($pipes[1]);
    fclose($pipes[2]);

    $processes[] = $process;
}

$exitCodes = [];

foreach ($processes as $process) {
    $exitCodes[] = proc_close($process);
}

$count = is_file($markerFile)
    ? (int)trim((string)file_get_contents($markerFile))
    : 0;

if (in_array(1, $exitCodes, true) || in_array(2, $exitCodes, true)) {
    fwrite(STDERR, "A cache-lock worker failed.\n");
    exit(1);
}

if ($count !== 1) {
    fwrite(
        STDERR,
        "Expected exactly one refresh producer, got {$count}.\n"
    );
    exit(1);
}

echo "PASS: 2 concurrent refresh attempts resulted in 1 API producer.\n";
exit(0);