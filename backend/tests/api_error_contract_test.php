<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$footballPath = $root . '/backend/api/football.php';
$playerDetailsPath = $root . '/backend/api/player-details.php';

$football = file_get_contents($footballPath);
$playerDetails = file_get_contents($playerDetailsPath);

if ($football === false || $playerDetails === false) {
    fwrite(STDERR, "FAIL: Could not read endpoint source files.\n");
    exit(1);
}

$checks = [
    'Football endpoint maps upstream HTTP failures to explicit API errors' =>
        str_contains($football, "Football-data.org atgrieza HTTP '") &&
        str_contains($football, 'sendFootballError('),
    'Football endpoint uses stale cache instead of manufacturing empty standings on failure' =>
        !str_contains($football, "if (\$name === 'standings') {\n            \$results[\$name] = ['standings' => []];"),
    'Football endpoint logs upstream HTTP failures' =>
        str_contains($football, "'Flow football-data request failed for '") &&
        str_contains($football, "': upstream HTTP '"),
    'Optional player sections expose warning metadata in the response' =>
        str_contains($playerDetails, "'warnings' => \$warnings") &&
        str_contains($playerDetails, "'section' => \$key") &&
        str_contains($playerDetails, "'message' => 'Šo informācijas sadaļu pašlaik neizdevās ielādēt.'"),
    'Optional player section failures are logged' =>
        str_contains($playerDetails, 'Flow player-details optional section failed ('),
];

$failed = 0;
foreach ($checks as $label => $passed) {
    if ($passed) {
        echo "PASS: {$label}\n";
    } else {
        fwrite(STDERR, "FAIL: {$label}\n");
        $failed++;
    }
}

if ($failed > 0) {
    exit(1);
}

echo 'PASS: All API error contract checks passed.' . PHP_EOL;
