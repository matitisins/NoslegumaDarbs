<?php

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$apiToken = '7099d187caea448e85c936be9ade7f1e';

$competition = $_GET['competition'] ?? 'PL';
$season = $_GET['season'] ?? '2026';

$allowedCompetitions = [
    'PL',
    'PD',
    'SA',
    'BL1',
    'FL1'
];

if (!in_array($competition, $allowedCompetitions, true)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'error' => 'Invalid competition.',
        'competition' => $competition
    ]);

    exit;
}

if (!preg_match('/^\d{4}$/', $season)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'error' => 'Invalid season.',
        'season' => $season
    ]);

    exit;
}

$baseUrl =
    'https://api.football-data.org/v4/competitions/' .
    rawurlencode($competition);

/*
 * Helper function for football-data.org requests.
 */
function footballDataRequest(
    string $url,
    string $apiToken
): array {
    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,

        CURLOPT_HTTPHEADER => [
            'X-Auth-Token: ' . $apiToken,
            'Accept: application/json'
        ]
    ]);

    $response = curl_exec($ch);

    $curlError = curl_error($ch);
    $curlErrno = curl_errno($ch);

    $statusCode = curl_getinfo(
        $ch,
        CURLINFO_HTTP_CODE
    );

    curl_close($ch);

    if ($response === false) {
        throw new Exception(
            'PHP cURL request failed: ' .
            $curlError .
            ' (errno ' .
            $curlErrno .
            ')'
        );
    }

    $decoded = json_decode(
        $response,
        true
    );

    if (
        $statusCode < 200 ||
        $statusCode >= 300
    ) {
        $message =
            $decoded['message'] ??
            $decoded['error'] ??
            'football-data.org returned HTTP ' .
            $statusCode;

        throw new Exception(
            $message
        );
    }

    if (!is_array($decoded)) {
        throw new Exception(
            'football-data.org returned invalid JSON.'
        );
    }

    return $decoded;
}

try {

    /*
     * Get every team participating in the competition.
     * Each team contains its squad and player positions.
     */
    $teamsUrl =
        $baseUrl .
        '/teams?season=' .
        rawurlencode($season);

    $teamsData =
        footballDataRequest(
            $teamsUrl,
            $apiToken
        );

    /*
     * Get scoring statistics.
     */
    $scorersUrl =
        $baseUrl .
        '/scorers?season=' .
        rawurlencode($season) .
        '&limit=100';

    $scorersData =
        footballDataRequest(
            $scorersUrl,
            $apiToken
        );

    $scorersByPlayerId = [];

    foreach (
        ($scorersData['scorers'] ?? [])
        as $scorer
    ) {
        $player =
            $scorer['player'] ?? [];

        $playerId =
            $player['id'] ?? null;

        if ($playerId === null) {
            continue;
        }

        $scorersByPlayerId[
            (string) $playerId
        ] = $scorer;
    }

    /*
     * Build a complete player list from every squad.
     */
    $players = [];
    $playerIds = [];

    foreach (
        ($teamsData['teams'] ?? [])
        as $team
    ) {

        $teamId =
            $team['id'] ?? null;

        $teamName =
            $team['name'] ??
            'Unknown Team';

        $teamShortName =
            $team['shortName'] ??
            $teamName;

        $teamCrest =
            $team['crest'] ??
            null;

        foreach (
            ($team['squad'] ?? [])
            as $squadPlayer
        ) {

            $playerId =
                $squadPlayer['id'] ??
                null;

            if ($playerId === null) {
                continue;
            }

            $playerKey =
                (string) $playerId;

            /*
             * Avoid duplicate players.
             */
            if (
                isset(
                    $playerIds[
                        $playerKey
                    ]
                )
            ) {
                continue;
            }

            $playerIds[
                $playerKey
            ] = true;

            $scorer =
                $scorersByPlayerId[
                    $playerKey
                ] ??
                [];

            $playerInfo =
                $scorer['player'] ??
                [];

            $position =
                $squadPlayer['position'] ??
                $playerInfo['position'] ??
                null;

            $players[] = [
                'player' => [
                    'id' =>
                        $playerId,

                    'name' =>
                        $squadPlayer['name'] ??
                        $playerInfo['name'] ??
                        'Unknown Player',

                    'firstName' =>
                        $squadPlayer['firstName'] ??
                        $playerInfo['firstName'] ??
                        null,

                    'lastName' =>
                        $squadPlayer['lastName'] ??
                        $playerInfo['lastName'] ??
                        null,

                    'position' =>
                        $position,

                    'dateOfBirth' =>
                        $squadPlayer['dateOfBirth'] ??
                        $playerInfo['dateOfBirth'] ??
                        null,

                    'nationality' =>
                        $squadPlayer['nationality'] ??
                        $playerInfo['nationality'] ??
                        null,

                    'shirtNumber' =>
                        $squadPlayer['shirtNumber'] ??
                        $playerInfo['shirtNumber'] ??
                        null
                ],

                'team' => [
                    'id' =>
                        $teamId,

                    'name' =>
                        $teamName,

                    'shortName' =>
                        $teamShortName,

                    'crest' =>
                        $teamCrest
                ],

                'playedMatches' =>
                    $scorer['playedMatches'] ??
                    0,

                'goals' =>
                    $scorer['goals'] ??
                    0,

                'assists' =>
                    $scorer['assists'] ??
                    0,

                'penalties' =>
                    $scorer['penalties'] ??
                    0
            ];
        }
    }

    /*
     * Sort players by position and then name.
     */
    usort(
        $players,
        function ($a, $b) {

            $positionA =
                strtolower(
                    $a['player']['position'] ?? ''
                );

            $positionB =
                strtolower(
                    $b['player']['position'] ?? ''
                );

            if (
                $positionA !==
                $positionB
            ) {
                return strcmp(
                    $positionA,
                    $positionB
                );
            }

            return strcmp(
                $a['player']['name'],
                $b['player']['name']
            );
        }
    );

    echo json_encode(
        [
            'count' =>
                count($players),

            'filters' => [
                'season' =>
                    (int) $season,

                'limit' =>
                    100
            ],

            'competition' =>
                $teamsData['competition'] ??
                [
                    'code' =>
                        $competition
                ],

            'season' =>
                $teamsData['season'] ??
                null,

            /*
             * We keep the name "scorers" so
             * the existing React app continues
             * working without breaking.
             *
             * It now contains ALL squad players.
             */
            'scorers' =>
                $players
        ],
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

} catch (Throwable $e) {

    http_response_code(502);

    echo json_encode(
        [
            'success' => false,
            'error' =>
                $e->getMessage(),

            'competition' =>
                $competition,

            'season' =>
                $season
        ],
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );
}