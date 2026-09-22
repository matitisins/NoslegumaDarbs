<?php

declare(strict_types=1);

$token = getenv(
    "FOOTBALL_DATA_API_TOKEN"
);

if (!$token) {
    $token = "" . ($_ENV["FOOTBALL_DATA_API_TOKEN"] ?? "");
}

define(
    "FOOTBALL_DATA_API_TOKEN",
    trim($token)
);

define(
    "FOOTBALL_DATA_API_BASE_URL",
    "https://api.football-data.org/v4"
);