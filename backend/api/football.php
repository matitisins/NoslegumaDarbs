<?php

/*
 * Šis fails nodrošina savienojumu ar Football-data.org API un iegūst
 * izvēlētās futbola līgas spēlētāju rezultātus, komandu informāciju un
 * turnīra tabulas datus. Tas apstrādā API pieprasījumus, kļūdas un
 * pieprasījumu ierobežojumus, kā arī izmanto kešatmiņu, lai samazinātu
 * atkārtotu API pieprasījumu skaitu un uzlabotu lietotnes darbību.
 *
 * API piekļuves tokens tiek iegūts no backend/.env faila, tādēļ tas
 * netiek glabāts tieši PHP pirmkodā.
 */ 

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Atļauts tikai GET pieprasījums.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/../src/api/config.php';

if (FOOTBALL_DATA_API_TOKEN === '') {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Servera vides mainīgais FOOTBALL_DATA_API_TOKEN nav konfigurēts backend/.env failā.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$allowedCompetitions = ['PL', 'PD', 'SA', 'BL1', 'FL1'];
$competition = strtoupper(trim((string)($_GET['competition'] ?? 'PL')));
$season = trim((string)($_GET['season'] ?? '2026'));

if (!in_array($competition, $allowedCompetitions, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Neatbalstīta līga.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!preg_match('/^\d{4}$/', $season)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Sezonai jābūt četrciparu gadam.'], JSON_UNESCAPED_UNICODE);
    exit;
}

function footballRequest(string $url): array
{
    $curl = curl_init($url);

    if ($curl === false) {
        throw new RuntimeException('Neizdevās inicializēt cURL.');
    }

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            'X-Auth-Token: ' . FOOTBALL_DATA_API_TOKEN,
            'Accept: application/json',
        ],
        CURLOPT_USERAGENT => 'Flow Football Analytics',
    ]);

    $body = curl_exec($curl);
    $error = curl_error($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($body === false) {
        throw new RuntimeException($error !== '' ? $error : 'Nezināma cURL kļūda.');
    }

    return ['status' => $status, 'body' => $body];
}

function cacheFile(string $directory, string $name): string
{
    return $directory . DIRECTORY_SEPARATOR . $name . '.json';
}

function readCache(string $file, bool $allowStale = false, int $maxAge = 1800): ?array
{
    if (!is_file($file)) {
        return null;
    }

    $modified = filemtime($file);
    if ($modified === false) {
        return null;
    }

    if (!$allowStale && time() - $modified > $maxAge) {
        return null;
    }

    $content = file_get_contents($file);
    if ($content === false || trim($content) === '') {
        return null;
    }

    $data = json_decode($content, true);
    return is_array($data) ? $data : null;
}

function writeCache(string $file, array $data): void
{
    @file_put_contents(
        $file,
        json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        LOCK_EX
    );
}

function sendFootballError(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

$cacheDirectory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'cache';
if (!is_dir($cacheDirectory)) {
    @mkdir($cacheDirectory, 0775, true);
}

$base = rtrim(FOOTBALL_DATA_API_BASE_URL, '/');
$competitionEncoded = rawurlencode($competition);
$seasonEncoded = rawurlencode($season);
$cacheAge = 1800;

$requests = [
    'scorers' => [
        $base . '/competitions/' . $competitionEncoded . '/scorers?season=' . $seasonEncoded . '&limit=100',
        cacheFile($cacheDirectory, 'scorers_' . $competition . '_' . $season),
    ],
    'teams' => [
        $base . '/competitions/' . $competitionEncoded . '/teams?season=' . $seasonEncoded,
        cacheFile($cacheDirectory, 'teams_' . $competition . '_' . $season),
    ],
    'standings' => [
        $base . '/competitions/' . $competitionEncoded . '/standings?season=' . $seasonEncoded,
        cacheFile($cacheDirectory, 'standings_' . $competition . '_' . $season),
    ],
];

$results = [];
$usedCache = false;

foreach ($requests as $name => [$url, $file]) {
    $cached = readCache($file, false, $cacheAge);

    if ($cached !== null) {
        $results[$name] = $cached;
        $usedCache = true;
        continue;
    }

    try {
        $response = footballRequest($url);

        if ($response['status'] === 429) {
            $stale = readCache($file, true);
            if ($stale !== null) {
                $results[$name] = $stale;
                $usedCache = true;
                continue;
            }
            sendFootballError(429, 'Football-data.org API limits ir sasniegts (429). Uzgaidi un mēģini vēlreiz.');
        }

        if ($response['status'] === 401) {
            sendFootballError(401, 'Football-data.org noraidīja API tokenu (401). Pārbaudi backend/.env.');
        }

        if ($response['status'] === 403) {
            if ($name === 'standings') {
                $results[$name] = ['standings' => []];
                continue;
            }
            sendFootballError(403, 'Football-data.org neatļauj šo pieprasījumu (403).');
        }

        if ($response['status'] === 404) {
            if ($name === 'standings') {
                $results[$name] = ['standings' => []];
                continue;
            }
            sendFootballError(404, 'Līga vai sezona nav atrasta (404).');
        }

        if ($response['status'] < 200 || $response['status'] >= 300) {
            if ($name === 'standings') {
                $results[$name] = ['standings' => []];
                continue;
            }
            sendFootballError(502, 'Football-data.org atgrieza HTTP ' . $response['status'] . '.');
        }

        $decoded = json_decode($response['body'], true);
        if (!is_array($decoded)) {
            if ($name === 'standings') {
                $results[$name] = ['standings' => []];
                continue;
            }
            sendFootballError(502, 'Football-data.org atgrieza nederīgu JSON.');
        }

        $results[$name] = $decoded;
        writeCache($file, $decoded);
    } catch (Throwable $error) {
        if ($name === 'standings') {
            $results[$name] = ['standings' => []];
            continue;
        }
        sendFootballError(500, $error->getMessage());
    }
}

$scorers = is_array($results['scorers']['scorers'] ?? null) ? $results['scorers']['scorers'] : [];
$teams = is_array($results['teams']['teams'] ?? null) ? $results['teams']['teams'] : [];
$standings = [];

foreach (($results['standings']['standings'] ?? []) as $standing) {
    if (!is_array($standing) || !is_array($standing['table'] ?? null)) {
        continue;
    }

    if (strtoupper((string)($standing['type'] ?? '')) === 'TOTAL') {
        $standings = $standing['table'];
        break;
    }
}

if (!$standings) {
    foreach (($results['standings']['standings'] ?? []) as $standing) {
        if (is_array($standing) && is_array($standing['table'] ?? null)) {
            $standings = $standing['table'];
            break;
        }
    }
}

echo json_encode([
    'success' => true,
    'competition' => $competition,
    'season' => (int)$season,
    'count' => count($scorers),
    'scorers' => $scorers,
    'teams' => $teams,
    'standings' => $standings,
    'source' => 'football-data.org',
    'cached' => $usedCache,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);