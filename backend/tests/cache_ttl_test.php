<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/api/config.php';

$expected = [
    'CACHE_TTL_FOOTBALL_DATA' => 1800,
    'CACHE_TTL_API_FOOTBALL_TEAMS' => 1800,
    'CACHE_TTL_API_FOOTBALL_TEAM_STATS' => 1800,
    'CACHE_TTL_API_FOOTBALL_H2H' => 3600,
    'CACHE_TTL_API_FOOTBALL_FDR' => 900,
    'CACHE_TTL_API_FOOTBALL_PLAYERS' => 1800,
    'CACHE_TTL_LEAGUE_STANDINGS' => 900,
    'CACHE_TTL_LEAGUE_FIXTURES' => 300,
    'CACHE_TTL_FPL' => 1800,
    'CACHE_TTL_PLAYER_DETAILS' => 21600,
];

foreach ($expected as $name => $value) {
    if (!defined($name) || constant($name) !== $value) {
        fwrite(STDERR, "FAIL: {$name} is not {$value}.\n");
        exit(1);
    }
}

$ttlNames = array_keys($expected);
foreach ($ttlNames as $name) {
    if (constant($name) <= 0) {
        fwrite(STDERR, "FAIL: {$name} must be positive.\n");
        exit(1);
    }
}

echo "PASS: all cache TTL constants are defined with the documented values.\n";