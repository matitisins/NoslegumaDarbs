<?php

declare(strict_types=1);


header("Content-Type: application/json; charset=utf-8");


$allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowedOrigins, true)) {
    header(
        "Access-Control-Allow-Origin: " . $origin
    );
} else {
    header(
        "Access-Control-Allow-Origin: *"
    );
}

header(
    "Access-Control-Allow-Methods: GET, OPTIONS"
);

header(
    "Access-Control-Allow-Headers: Content-Type, Accept"
);

header(
    "Access-Control-Max-Age: 86400"
);


if (
    ($_SERVER["REQUEST_METHOD"] ?? "GET") ===
    "OPTIONS"
) {
    http_response_code(204);
    exit;
}


function respond(
    array $data,
    int $status = 200
): void {
    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}


if (
    ($_SERVER["REQUEST_METHOD"] ?? "GET") !==
    "GET"
) {
    respond(
        [
            "success" => false,
            "error" =>
                "Method not allowed.",
        ],
        405
    );
}


$configPath =
    __DIR__ .
    "/../../src/api/config.php";

if (!file_exists($configPath)) {
    respond(
        [
            "success" => false,
            "error" =>
                "Configuration file not found.",
        ],
        500
    );
}

require_once $configPath;


$token = "";

if (
    defined(
        "FOOTBALL_DATA_API_TOKEN"
    )
) {
    $token =
        (string) FOOTBALL_DATA_API_TOKEN;
}

if (
    $token === "" &&
    isset($footballDataToken)
) {
    $token =
        (string) $footballDataToken;
}

if (
    $token === "" &&
    isset($apiToken)
) {
    $token =
        (string) $apiToken;
}

if ($token === "") {
    respond(
        [
            "success" => false,
            "error" =>
                "Football-data.org API token is not configured.",
        ],
        500
    );
}


$competition =
    strtoupper(
        trim(
            (string) (
                $_GET["competition"] ??
                "PL"
            )
        )
    );

$season =
    (int) (
        $_GET["season"] ??
        date("Y")
    );


$allowedCompetitions = [
    "PL",
    "PD",
    "SA",
    "BL1",
    "FL1",
];

if (
    !in_array(
        $competition,
        $allowedCompetitions,
        true
    )
) {
    respond(
        [
            "success" => false,
            "error" =>
                "Invalid competition.",
            "competition" =>
                $competition,
        ],
        400
    );
}


if (
    $season < 2018 ||
    $season > ((int) date("Y") + 1)
) {
    respond(
        [
            "success" => false,
            "error" =>
                "Invalid season.",
            "season" =>
                $season,
        ],
        400
    );
}


function footballDataRequest(
    string $url,
    string $token
): array {
    if (
        !function_exists("curl_init")
    ) {
        respond(
            [
                "success" => false,
                "error" =>
                    "PHP cURL extension is not enabled.",
            ],
            500
        );
    }

    $curl = curl_init();

    curl_setopt_array(
        $curl,
        [
            CURLOPT_URL => $url,

            CURLOPT_RETURNTRANSFER => true,

            CURLOPT_FOLLOWLOCATION => true,

            CURLOPT_TIMEOUT => 30,

            CURLOPT_CONNECTTIMEOUT => 10,

            CURLOPT_HTTPHEADER => [
                "X-Auth-Token: " .
                    $token,

                "Accept: application/json",
            ],
        ]
    );

    $body =
        curl_exec($curl);

    $curlError =
        curl_error($curl);

    $httpCode =
        (int) curl_getinfo(
            $curl,
            CURLINFO_HTTP_CODE
        );

    curl_close($curl);

    if ($body === false) {
        respond(
            [
                "success" => false,
                "error" =>
                    "Football-data.org connection failed.",
                "details" =>
                    $curlError,
            ],
            502
        );
    }

    $data =
        json_decode(
            $body,
            true
        );

    if (
        !is_array($data)
    ) {
        respond(
            [
                "success" => false,
                "error" =>
                    "Football-data.org returned invalid JSON.",
                "status" =>
                    $httpCode,
            ],
            502
        );
    }

    if (
        $httpCode < 200 ||
        $httpCode >= 300
    ) {
        $message =
            $data["message"] ??
            $data["error"] ??
            "Football-data.org API error.";

        respond(
            [
                "success" => false,
                "error" =>
                    $message,
                "status" =>
                    $httpCode,
            ],
            $httpCode >= 400
                ? $httpCode
                : 502
        );
    }

    return $data;
}


$baseUrl =
    "https://api.football-data.org/v4";

$scorersUrl =
    $baseUrl .
    "/competitions/" .
    rawurlencode($competition) .
    "/scorers?season=" .
    rawurlencode((string) $season) .
    "&limit=100";

$teamsUrl =
    $baseUrl .
    "/competitions/" .
    rawurlencode($competition) .
    "/teams?season=" .
    rawurlencode((string) $season);


$scorersResponse =
    footballDataRequest(
        $scorersUrl,
        $token
    );

$teamsResponse =
    footballDataRequest(
        $teamsUrl,
        $token
    );


$scorers =
    $scorersResponse["scorers"] ??
    [];

$teams =
    $teamsResponse["teams"] ??
    [];

if (
    !is_array($scorers)
) {
    $scorers = [];
}

if (
    !is_array($teams)
) {
    $teams = [];
}

respond(
    [
        "success" => true,

        "competition" =>
            $competition,

        "season" =>
            $season,

        "count" =>
            count($scorers),

        "scorers" =>
            $scorers,

        "teams" =>
            $teams,

        "source" =>
            "football-data.org",
    ]
);