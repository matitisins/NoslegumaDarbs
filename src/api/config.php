<?php

declare(strict_types=1);

$token = getenv(
    "FOOTBALL_DATA_API_TOKEN"
);

if (!$token) {
    $token = "7099d187caea448e85c936be9ade7f1e";
}

define(
    "FOOTBALL_DATA_API_TOKEN",
    trim($token)
);

define(
    "FOOTBALL_DATA_API_BASE_URL",
    "https://api.football-data.org/v4"
);