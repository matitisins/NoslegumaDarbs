<?php

declare(strict_types=1);

/**
 * Flow Football Analytics
 *
 * Backend proxy for football-data.org.
 *
 * Features:
 * - API token stays on the PHP server
 * - Reads token from backend/.env
 * - CORS support for React/Vite
 * - Fetches scorers, teams and standings
 * - Server-side caching to reduce API requests
 * - Uses cached data when football-data.org returns 429
 */

header(
    'Content-Type: application/json; charset=utf-8'
);

header(
    'Access-Control-Allow-Origin: *'
);

header(
    'Access-Control-Allow-Methods: GET, OPTIONS'
);

header(
    'Access-Control-Allow-Headers: Content-Type, X-Requested-With'
);


/*
|--------------------------------------------------------------------------
| CORS preflight
|--------------------------------------------------------------------------
*/

if (
    ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS'
) {
    http_response_code(204);
    exit;
}


/*
|--------------------------------------------------------------------------
| Only GET is supported
|--------------------------------------------------------------------------
*/

if (
    ($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET'
) {
    http_response_code(405);

    echo json_encode(
        [
            'success' => false,
            'error' => 'Atļauts tikai GET pieprasījums.',
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


/*
|--------------------------------------------------------------------------
| Load configuration
|--------------------------------------------------------------------------
*/

require_once __DIR__ . '/../src/api/config.php';


/*
|--------------------------------------------------------------------------
| Check API token
|--------------------------------------------------------------------------
*/

if (
    !defined('FOOTBALL_DATA_API_TOKEN') ||
    trim((string) FOOTBALL_DATA_API_TOKEN) === ''
) {
    http_response_code(500);

    echo json_encode(
        [
            'success' => false,
            'error' =>
                'Servera vides mainīgais FOOTBALL_DATA_API_TOKEN nav konfigurēts.',
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


/*
|--------------------------------------------------------------------------
| Supported competitions
|--------------------------------------------------------------------------
*/

$allowedCompetitions = [
    'PL',
    'PD',
    'SA',
    'BL1',
    'FL1',
];


/*
|--------------------------------------------------------------------------
| Read request parameters
|--------------------------------------------------------------------------
*/

$competition = strtoupper(
    trim(
        (string) (
            $_GET['competition'] ?? 'PL'
        )
    )
);

$season = trim(
    (string) (
        $_GET['season'] ?? '2026'
    )
);


/*
|--------------------------------------------------------------------------
| Validate competition
|--------------------------------------------------------------------------
*/

if (
    !in_array(
        $competition,
        $allowedCompetitions,
        true
    )
) {
    http_response_code(400);

    echo json_encode(
        [
            'success' => false,
            'error' => 'Neatbalstīta līga.',
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


/*
|--------------------------------------------------------------------------
| Validate season
|--------------------------------------------------------------------------
*/

if (
    !preg_match(
        '/^\d{4}$/',
        $season
    )
) {
    http_response_code(400);

    echo json_encode(
        [
            'success' => false,
            'error' =>
                'Sezonai jābūt četrciparu gadam.',
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


/*
|--------------------------------------------------------------------------
| API helper
|--------------------------------------------------------------------------
*/

function footballRequest(
    string $url
): array {
    $ch = curl_init($url);

    if ($ch === false) {
        throw new RuntimeException(
            'Neizdevās inicializēt cURL.'
        );
    }

    curl_setopt_array(
        $ch,
        [
            CURLOPT_RETURNTRANSFER => true,

            CURLOPT_FOLLOWLOCATION => true,

            CURLOPT_CONNECTTIMEOUT => 10,

            CURLOPT_TIMEOUT => 30,

            CURLOPT_HTTPHEADER => [
                'X-Auth-Token: ' .
                    FOOTBALL_DATA_API_TOKEN,

                'Accept: application/json',
            ],

            CURLOPT_USERAGENT =>
                'Flow Football Analytics',
        ]
    );

    $body = curl_exec($ch);

    $curlError = curl_error($ch);

    $status = (int) curl_getinfo(
        $ch,
        CURLINFO_HTTP_CODE
    );

    curl_close($ch);

    if ($body === false) {
        throw new RuntimeException(
            $curlError !== ''
                ? $curlError
                : 'Nezināma cURL kļūda.'
        );
    }

    return [
        'status' => $status,
        'body' => $body,
    ];
}


/*
|--------------------------------------------------------------------------
| API error helper
|--------------------------------------------------------------------------
*/

function apiError(
    int $status,
    string $message
): never {
    http_response_code($status);

    echo json_encode(
        [
            'success' => false,
            'error' => $message,
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


/*
|--------------------------------------------------------------------------
| Cache configuration
|--------------------------------------------------------------------------
|
| Cache is stored inside:
|
| backend/cache/
|
| Cache lifetime:
| 30 minutes
|
| This means repeatedly opening Flow does NOT repeatedly
| consume your football-data.org API requests.
|
*/

$cacheDirectory =
    dirname(__DIR__) .
    DIRECTORY_SEPARATOR .
    'cache';


$cacheLifetime = 1800;


/*
|--------------------------------------------------------------------------
| Create cache directory if necessary
|--------------------------------------------------------------------------
*/

if (
    !is_dir($cacheDirectory)
) {
    @mkdir(
        $cacheDirectory,
        0775,
        true
    );
}


/*
|--------------------------------------------------------------------------
| Cache helpers
|--------------------------------------------------------------------------
*/

function getCacheFile(
    string $cacheDirectory,
    string $name
): string {
    return $cacheDirectory .
        DIRECTORY_SEPARATOR .
        $name .
        '.json';
}


function readCache(
    string $file,
    int $maxAge
): ?array {
    if (
        !is_file($file)
    ) {
        return null;
    }

    $modified =
        filemtime($file);

    if (
        $modified === false
    ) {
        return null;
    }

    if (
        time() - $modified > $maxAge
    ) {
        return null;
    }

    $contents =
        file_get_contents($file);

    if (
        $contents === false ||
        trim($contents) === ''
    ) {
        return null;
    }

    $data =
        json_decode(
            $contents,
            true
        );

    return is_array($data)
        ? $data
        : null;
}


function writeCache(
    string $file,
    array $data
): void {
    @file_put_contents(
        $file,
        json_encode(
            $data,
            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES
        ),
        LOCK_EX
    );
}


/*
|--------------------------------------------------------------------------
| Create unique cache names
|--------------------------------------------------------------------------
*/

$safeCompetition =
    preg_replace(
        '/[^A-Z0-9_-]/',
        '',
        $competition
    );

$safeSeason =
    preg_replace(
        '/[^0-9]/',
        '',
        $season
    );


$scorersCacheFile =
    getCacheFile(
        $cacheDirectory,
        'scorers_' .
            $safeCompetition .
            '_' .
            $safeSeason
    );


$teamsCacheFile =
    getCacheFile(
        $cacheDirectory,
        'teams_' .
            $safeCompetition .
            '_' .
            $safeSeason
    );


$standingsCacheFile =
    getCacheFile(
        $cacheDirectory,
        'standings_' .
            $safeCompetition .
            '_' .
            $safeSeason
    );


/*
|--------------------------------------------------------------------------
| Football-data.org URLs
|--------------------------------------------------------------------------
*/

$base =
    defined(
        'FOOTBALL_DATA_API_BASE_URL'
    )
        ? rtrim(
            FOOTBALL_DATA_API_BASE_URL,
            '/'
        )
        : 'https://api.football-data.org/v4';


$encodedCompetition =
    rawurlencode(
        $competition
    );


$encodedSeason =
    rawurlencode(
        $season
    );


/*
|--------------------------------------------------------------------------
| Scorers URL
|--------------------------------------------------------------------------
*/

$scorersUrl =
    $base .
    '/competitions/' .
    $encodedCompetition .
    '/scorers?season=' .
    $encodedSeason .
    '&limit=100';


/*
|--------------------------------------------------------------------------
| Teams URL
|--------------------------------------------------------------------------
*/

$teamsUrl =
    $base .
    '/competitions/' .
    $encodedCompetition .
    '/teams?season=' .
    $encodedSeason;


/*
|--------------------------------------------------------------------------
| Standings URL
|--------------------------------------------------------------------------
*/

$standingsUrl =
    $base .
    '/competitions/' .
    $encodedCompetition .
    '/standings?season=' .
    $encodedSeason;


/*
|--------------------------------------------------------------------------
| Load cached data first
|--------------------------------------------------------------------------
*/

$scorersResult =
    readCache(
        $scorersCacheFile,
        $cacheLifetime
    );


$teamsResult =
    readCache(
        $teamsCacheFile,
        $cacheLifetime
    );


$standingsResult =
    readCache(
        $standingsCacheFile,
        $cacheLifetime
    );


$usedCache = false;


/*
|--------------------------------------------------------------------------
| Fetch scorers if necessary
|--------------------------------------------------------------------------
*/

if (
    $scorersResult === null
) {
    try {
        $response =
            footballRequest(
                $scorersUrl
            );

        if (
            $response['status'] === 429
        ) {
            /*
             * Try older cache if API rate limit is reached.
             */
            $stale =
                readCache(
                    $scorersCacheFile,
                    PHP_INT_MAX
                );

            if (
                $stale !== null
            ) {
                $scorersResult =
                    $stale;

                $usedCache = true;
            } else {
                apiError(
                    429,
                    'Football-data.org API limits ir sasniegts (429). Uzgaidi un mēģini vēlreiz.'
                );
            }
        } elseif (
            $response['status'] === 401
        ) {
            apiError(
                401,
                'Football-data.org noraidīja API tokenu (401). Pārbaudi backend/.env.'
            );
        } elseif (
            $response['status'] === 403
        ) {
            apiError(
                403,
                'Football-data.org neatļauj šo pieprasījumu (403). Pārbaudi API plāna tiesības.'
            );
        } elseif (
            $response['status'] === 404
        ) {
            apiError(
                404,
                'Līga vai sezona nav atrasta (404).'
            );
        } elseif (
            $response['status'] < 200 ||
            $response['status'] >= 300
        ) {
            apiError(
                502,
                'Football-data.org atgrieza HTTP ' .
                    $response['status'] .
                    '.'
            );
        } else {
            $scorersResult =
                json_decode(
                    $response['body'],
                    true
                );

            if (
                !is_array($scorersResult)
            ) {
                apiError(
                    502,
                    'Football-data.org atgrieza nederīgu scorers JSON.'
                );
            }

            writeCache(
                $scorersCacheFile,
                $scorersResult
            );
        }
    } catch (
        Throwable $error
    ) {
        apiError(
            500,
            $error->getMessage()
        );
    }
} else {
    $usedCache = true;
}


/*
|--------------------------------------------------------------------------
| Fetch teams if necessary
|--------------------------------------------------------------------------
*/

if (
    $teamsResult === null
) {
    try {
        $response =
            footballRequest(
                $teamsUrl
            );

        if (
            $response['status'] === 429
        ) {
            $stale =
                readCache(
                    $teamsCacheFile,
                    PHP_INT_MAX
                );

            if (
                $stale !== null
            ) {
                $teamsResult =
                    $stale;

                $usedCache = true;
            } else {
                apiError(
                    429,
                    'Football-data.org API limits ir sasniegts (429). Uzgaidi un mēģini vēlreiz.'
                );
            }
        } elseif (
            $response['status'] === 401
        ) {
            apiError(
                401,
                'Football-data.org noraidīja API tokenu (401). Pārbaudi backend/.env.'
            );
        } elseif (
            $response['status'] === 403
        ) {
            apiError(
                403,
                'Football-data.org neatļauj šo pieprasījumu (403). Pārbaudi API plāna tiesības.'
            );
        } elseif (
            $response['status'] === 404
        ) {
            apiError(
                404,
                'Līga vai sezona nav atrasta (404).'
            );
        } elseif (
            $response['status'] < 200 ||
            $response['status'] >= 300
        ) {
            apiError(
                502,
                'Football-data.org atgrieza HTTP ' .
                    $response['status'] .
                    '.'
            );
        } else {
            $teamsResult =
                json_decode(
                    $response['body'],
                    true
                );

            if (
                !is_array($teamsResult)
            ) {
                apiError(
                    502,
                    'Football-data.org atgrieza nederīgu teams JSON.'
                );
            }

            writeCache(
                $teamsCacheFile,
                $teamsResult
            );
        }
    } catch (
        Throwable $error
    ) {
        apiError(
            500,
            $error->getMessage()
        );
    }
} else {
    $usedCache = true;
}


/*
|--------------------------------------------------------------------------
| Fetch standings if necessary
|--------------------------------------------------------------------------
*/

if (
    $standingsResult === null
) {
    try {
        $response =
            footballRequest(
                $standingsUrl
            );

        if (
            $response['status'] === 429
        ) {
            $stale =
                readCache(
                    $standingsCacheFile,
                    PHP_INT_MAX
                );

            if (
                $stale !== null
            ) {
                $standingsResult =
                    $stale;

                $usedCache = true;
            } else {
                /*
                 * We don't immediately destroy the whole
                 * player request if standings are rate limited.
                 *
                 * The frontend can still use players.
                 *
                 * FDR will use its fallback until standings
                 * become available.
                 */
                $standingsResult = [
                    'standings' => [],
                ];

                $usedCache = true;
            }
        } elseif (
            $response['status'] === 401
        ) {
            apiError(
                401,
                'Football-data.org noraidīja API tokenu (401). Pārbaudi backend/.env.'
            );
        } elseif (
            $response['status'] === 403
        ) {
            /*
             * Some API plans may not expose every endpoint.
             *
             * Keep player functionality working.
             */
            $standingsResult = [
                'standings' => [],
            ];

            $usedCache = true;
        } elseif (
            $response['status'] === 404
        ) {
            $standingsResult = [
                'standings' => [],
            ];

            $usedCache = true;
        } elseif (
            $response['status'] < 200 ||
            $response['status'] >= 300
        ) {
            $standingsResult = [
                'standings' => [],
            ];

            $usedCache = true;
        } else {
            $standingsResult =
                json_decode(
                    $response['body'],
                    true
                );

            if (
                !is_array($standingsResult)
            ) {
                $standingsResult = [
                    'standings' => [],
                ];
            } else {
                writeCache(
                    $standingsCacheFile,
                    $standingsResult
                );
            }
        }
    } catch (
        Throwable $error
    ) {
        $standingsResult = [
            'standings' => [],
        ];

        $usedCache = true;
    }
} else {
    $usedCache = true;
}


/*
|--------------------------------------------------------------------------
| Extract scorers
|--------------------------------------------------------------------------
*/

$scorers =
    is_array(
        $scorersResult['scorers'] ?? null
    )
        ? $scorersResult['scorers']
        : [];


/*
|--------------------------------------------------------------------------
| Extract teams
|--------------------------------------------------------------------------
*/

$teams =
    is_array(
        $teamsResult['teams'] ?? null
    )
        ? $teamsResult['teams']
        : [];


/*
|--------------------------------------------------------------------------
| Extract standings
|--------------------------------------------------------------------------
*/

$standings = [];


if (
    isset(
        $standingsResult['standings']
    ) &&
    is_array(
        $standingsResult['standings']
    )
) {

    /*
     * Prefer TOTAL standings.
     */
    foreach (
        $standingsResult['standings']
        as $standing
    ) {

        if (
            !is_array($standing)
        ) {
            continue;
        }

        $type =
            strtoupper(
                (string) (
                    $standing['type'] ?? ''
                )
            );

        if (
            $type === 'TOTAL' &&
            isset(
                $standing['table']
            ) &&
            is_array(
                $standing['table']
            )
        ) {
            $standings =
                $standing['table'];

            break;
        }
    }


    /*
     * Fallback to the first available
     * standings table.
     */
    if (
        !$standings
    ) {

        foreach (
            $standingsResult['standings']
            as $standing
        ) {

            if (
                isset(
                    $standing['table']
                ) &&
                is_array(
                    $standing['table']
                )
            ) {
                $standings =
                    $standing['table'];

                break;
            }
        }
    }
}


/*
|--------------------------------------------------------------------------
| Return response
|--------------------------------------------------------------------------
|
| The API token is NEVER included.
|--------------------------------------------------------------------------
*/

echo json_encode(
    [
        'success' => true,

        'competition' =>
            $competition,

        'season' =>
            (int) $season,

        'count' =>
            count($scorers),

        'scorers' =>
            $scorers,

        'teams' =>
            $teams,

        'standings' =>
            $standings,

        'source' =>
            'football-data.org',

        'cached' =>
            $usedCache,
    ],
    JSON_UNESCAPED_UNICODE |
    JSON_UNESCAPED_SLASHES
);