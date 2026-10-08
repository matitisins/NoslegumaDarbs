# Flow Football Analytics

Flow Football Analytics ir React + PHP futbola analītikas lietotne, kas paredzēta futbolistu, komandu un līgu datu analīzei un Fantasy Football lēmumu atbalstam.

Projekts sastāv no React/Vite frontend daļas un PHP backend starpslāņa. Backend glabā ārējo API atslēgas servera pusē, veic pieprasījumu validāciju, rate limiting un datu kešatmiņu.

## 1. Galvenās funkcijas

- Spēlētāju meklēšana un salīdzināšana.
- Spēlētāju profili un sezonas statistika.
- Pēdējo 5 un nākamo 5 spēļu informācija, ja dati ir pieejami.
- Komandu analīze un savstarpējā statistika.
- League Tables ar komandu pozīcijām, punktiem un rezultātiem.
- Player Recommendations.
- Custom Player Ranking.
- Fantasy Team Builder ar formācijām, budžetu, kapteini un vicekapteini.
- Fantasy komandas validācija pēc sastāva, pozīcijām, budžeta un klubu ierobežojumiem.
- Captaincy Simulator.
- Favorīti un lokāls lietotāja profils.
- FDR jeb spēļu sarežģītības analīze.
- Backend kešatmiņa, lai samazinātu atkārtotus ārējo API pieprasījumus.
- Backend rate limiting publiskajiem API endpointiem.

## 2. Izmantotās tehnoloģijas

### Frontend

- React 18
- Vite 6
- JavaScript ES modules
- Tailwind CSS
- html2canvas

### Backend

- PHP 8.2+ ieteicams
- PHP cURL
- JSON
- Apache
- Lokāla failu kešatmiņa

### Ārējie datu avoti

- API-Football / API-Sports
- Football-data.org
- Official Fantasy Premier League API

## 3. Projekta struktūra

```text
Nosleguma_Darbs/
├── backend/
│   ├── api/
│   │   ├── api-football.php
│   │   ├── football.php
│   │   ├── fpl.php
│   │   ├── league-data.php
│   │   └── player-details.php
│   ├── src/
│   │   └── api/
│   │       └── config.php
│   ├── cache/
│   ├── .env.example
│   └── .gitignore
├── public/
├── src/
│   ├── components/
│   │   ├── analytics/
│   │   └── app/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── config/
│   ├── App.jsx
│   ├── App.css
│   ├── LeagueTables.jsx
│   ├── LeagueTableUtils.js
│   ├── TeamPage.jsx
│   └── main.jsx
├── tests/
│   └── fantasyRules.test.js
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

Lielākā frontend loģika ir sadalīta mazākos komponentos, servisos, utilītās un hookos, lai izvairītos no viena ļoti liela faila un lai katrai funkcionalitātes daļai būtu skaidrāka atbildības robeža.

## 4. Prasības

Nepieciešams:

- Node.js 18 vai jaunāks; ieteicams LTS izlaidums.
- npm.
- PHP 8.2 vai jaunāks.
- PHP cURL paplašinājums.
- Apache vai cita PHP servera vide, piemēram, Laragon vai XAMPP.
- Interneta savienojums ārējo API datu iegūšanai.

## 5. Instalēšana

Atver termināli projekta saknes mapē:

```bash
npm install
```

Pēc instalēšanas var pārbaudīt, vai projekts tiek veiksmīgi būvēts:

```bash
npm run build
```

## 6. Backend API atslēgu konfigurācija

API atslēgas nav jāievieto React frontend kodā.

Nokopē:

```text
backend/.env.example
```

uz:

```text
backend/.env
```

un aizpildi:

```env
FOOTBALL_DATA_API_TOKEN=your_football_data_token
API_FOOTBALL_KEY=your_api_football_key
RATE_LIMIT_REQUESTS_PER_MINUTE=180
```

`backend/src/api/config.php` nolasa šīs vērtības no servera vides vai lokālā `backend/.env` faila.

Svarīgi:

- `backend/.env` nedrīkst publicēt Git repozitorijā.
- `backend/.env` nedrīkst iekļaut gala iesnieguma ZIP failā.
- API atslēgas nedrīkst ievietot `src/` mapē.
- Ja API atslēga kādreiz ir nonākusi publiskā repozitorijā, tā ir jāmaina/atsauc pie attiecīgā API nodrošinātāja.

## 7. Apache, Laragon vai XAMPP konfigurācija

Backend ir PHP lietotne, tāpēc Apache serverim jābūt ieslēgtam.

### Laragon piemērs

Ja projekts atrodas:

```text
C:\laragon\www\Nosleguma_Darbs\Nosleguma_Darbs
```

tad Apache projekta adrese parasti ir:

```text
http://localhost/Nosleguma_Darbs/Nosleguma_Darbs
```

Vite proxy mērķi var iestatīt projekta saknes `.env.local` failā:

```env
VITE_BACKEND_PROXY_TARGET=http://localhost/Nosleguma_Darbs/Nosleguma_Darbs
```

### XAMPP piemērs

Ja projekts atrodas:

```text
C:\xampp\htdocs\Nosleguma_Darbs
```

tad Apache adrese var būt:

```text
http://localhost/Nosleguma_Darbs
```

Proxy mērķim jānorāda tā projekta Apache adrese, kurā atrodas `backend/` mape.

## 8. Frontend izstrādes režīms

Palaid Vite:

```bash
npm run dev
```

Noklusējuma adrese:

```text
http://localhost:5173
```

Izstrādes režīmā frontend izmanto:

```text
/backend/api
```

un `vite.config.js` pārsūta šos pieprasījumus uz PHP backend.

Ja Apache projekta adrese atšķiras no noklusējuma, izveido:

```text
.env.local
```

un iestati:

```env
VITE_BACKEND_PROXY_TARGET=http://localhost/TAVA_PROJEKTA_ADRESE
```

`VITE_BACKEND_PROXY_TARGET` ir lokālās izstrādes konfigurācija; tas nav API noslēpums.

## 9. Frontend API konfigurācija

Frontend API bāzes adrese atrodas:

```text
src/config/api.js
```

Pēc noklusējuma:

```text
/backend/api
```

Production režīmā, ja frontend un backend atrodas vienā Apache projekta saknē, tiek izmantots relatīvs backend ceļš.

Tas ļauj izvairīties no piesaistes konkrētam autora datora mapes nosaukumam.

## 10. Backend endpointi

Backend API endpointi atrodas:

```text
backend/api/
```

Galvenie endpointi:

```text
api-football.php
football.php
fpl.php
league-data.php
player-details.php
```

Backend:

- validē ienākošos parametrus;
- neizvada API atslēgas frontendam;
- izmanto cURL ārējiem API pieprasījumiem;
- izmanto kešatmiņu atkārtotu pieprasījumu samazināšanai;
- izmanto rate limiting publiskajiem pieprasījumiem;
- atgriež JSON atbildes frontendam.

## 11. Testi

Automātiskie testi tiek palaisti ar:

```bash
npm test
```

Testu fails:

```text
tests/fantasyRules.test.js
```

Testi pārbauda Fantasy loģikas kritiskās daļas, tostarp:

- budžeta aprēķinu;
- budžeta pārsniegšanas noraidīšanu;
- atšķirīgu kapteini un vicekapteini;
- automātiski veidotā sākumsastāva budžeta ierobežojumu;
- pilna 15 spēlētāju sastāva validāciju;
- 4 rezervistu prasību;
- vārtsargu, aizsargu, pussargu un uzbrucēju sastāva prasības;
- maksimāli 3 spēlētājus no viena kluba.

## 12. Fantasy Team Builder noteikumi

Fantasy Team Builder izmanto centralizētu noteikumu failu:

```text
src/utils/fantasyRules.js
```

Derīgam pilnam Fantasy sastāvam jābūt:

```text
15 spēlētāji
11 sākumsastāvā
4 rezervisti

2 vārtsargi
5 aizsargi
5 pussargi
3 uzbrucēji
```

Papildus tiek pārbaudīts:

- ne vairāk kā 3 spēlētāji no viena kluba;
- nav dublikātu;
- budžets netiek pārsniegts;
- sākumsastāvā ir 1 vārtsargs;
- sākumsastāvā ir 3–5 aizsargi;
- sākumsastāvā ir 2–5 pussargi;
- sākumsastāvā ir 1–3 uzbrucēji;
- kapteinis un vicekapteinis ir atšķirīgi sākumsastāva spēlētāji.

Automātiskā `Ieteiktais XI` izvēle ir heuristiska izvēle. Tā nav garantēti optimāla matemātiska Fantasy komanda.

## 13. Punktu un prognožu terminoloģija

Projektā ir nodalīti dažādi statistikas rādītāji.

**Official FPL points** — oficiālie Fantasy Premier League punkti, ja tie ir pieejami no FPL API.

**Flow points** — projekta paša aprēķināts rādītājs spēlētāju salīdzināšanai.

**Projected GW points** — heuristisks projekta aprēķins par iespējamo nākamās spēļu kārtas sniegumu. Tas nav oficiāls FPL rezultāts un nav garantēta prognoze.

**Recommendation Score** — heuristisks ieteikuma vērtējums. Tas nav statistiska varbūtība. Piemēram, `85` nav jāinterpretē kā `85%` varbūtība.

## 14. Avatar profils

Profila attēls tiek saglabāts pārlūka `localStorage`.

Projektā nav servera lietotāju kontu un autentifikācijas sistēmas.

Attēla augšupielādes limits ir 2 MB. Lielāki faili tiek noraidīti, lai samazinātu `localStorage` izmantošanas risku.

## 15. Kešatmiņa

Backend kešatmiņa atrodas:

```text
backend/cache/
```

Kešatmiņa tiek izmantota ārējo API atbilžu saglabāšanai uz noteiktu laiku.

Kešatmiņa:

- samazina atkārtotu ārējo API pieprasījumu skaitu;
- palīdz izvairīties no nevajadzīgas API slodzes;
- nav projekta primārā datubāze;
- nav nepieciešama gala iesnieguma ZIP failā.

`backend/cache/` ir iekļauts `.gitignore`.

## 16. PHP sintakses pārbaude

PHP failu sintaksi var pārbaudīt ar:

```bash
php -l backend/api/api-football.php
php -l backend/api/football.php
php -l backend/api/league-data.php
php -l backend/api/fpl.php
php -l backend/api/player-details.php
php -l backend/src/api/config.php
```

`php -l` tikai pārbauda sintaksi un nemaina failu.

## 17. Production build

Pirms gala iesniegšanas palaid:

```bash
npm run build
```

Veiksmīga build rezultātā tiek izveidota:

```text
dist/
```

Production build pārbauda, vai frontend kodu var veiksmīgi sakompilēt.

`dist/` nav nepieciešams iekļaut avota koda gala iesniegumā, ja pasniedzējs nav prasījis tieši production build failus.

## 18. Biežākās problēmas

### `npm install` neizdodas

Pārbaudi Node.js un npm versiju. Ja atkarības ir bojātas:

```bash
rmdir /s /q node_modules
npm install
```

### `npm run build` neizdodas

Vispirms:

```bash
npm install
npm run build
```

Ja kļūda norāda konkrētu importu, pārbaudi, vai attiecīgais fails eksistē un importētais exports ir pieejams.

### `API key is missing`

Pārbaudi:

```text
backend/.env
```

un mainīgo nosaukumus:

```env
FOOTBALL_DATA_API_TOKEN=
API_FOOTBALL_KEY=
```

### API atgriež `401` vai `403`

Pārbaudi API atslēgu, tās piekļuves tiesības un attiecīgā ārējā pakalpojuma limitus.

### PHP cURL kļūda

Pārbaudi, vai PHP konfigurācijā ir ieslēgts cURL paplašinājums.

### Frontend nevar sasniegt backend

Pārbaudi:

1. vai Apache darbojas;
2. vai projekta Apache adrese ir pareiza;
3. vai `.env.local` satur pareizu `VITE_BACKEND_PROXY_TARGET`;
4. vai `backend/api/` ir pieejams caur Apache.

## 19. Gala iesnieguma sagatavošana

Pirms projekta iesniegšanas:

```text
[ ] npm install izdodas bez kļūdām
[ ] npm test izdodas bez kļūdām
[ ] npm run build izdodas bez kļūdām
[ ] PHP faili iziet php -l pārbaudi
[ ] backend/.env nav gala ZIP failā
[ ] .env.local nav gala ZIP failā
[ ] API atslēgas nav frontend kodā
[ ] nav īstu API atslēgu .env.example failos
[ ] README apraksta instalēšanu un palaišanu
[ ] projekts nav piesaistīts konkrētam autora datora mapes nosaukumam
[ ] Fantasy Builder ievēro 15 spēlētāju sastāva noteikumus
[ ] budžets netiek pārsniegts
[ ] maksimāli 3 spēlētāji no viena kluba
[ ] kapteinis un vicekapteinis tiek validēti
[ ] testi darbojas
[ ] production build darbojas
```

### Gala ZIP failā nav jāiekļauj

```text
node_modules/
dist/
backend/cache/
backend/.env
.env
.env.local
```

Ja pasniedzējs pieprasa citādu iesnieguma struktūru, jāievēro pasniedzēja konkrētās prasības.

## 20. Ātrā palaišana

Pēc konfigurācijas tipiska izstrādes sesija ir:

```bash
npm install
npm run dev
```

Pirms iesniegšanas:

```bash
npm test
npm run build
```

PHP sintakses pārbaude:

```bash
php -l backend/api/api-football.php
php -l backend/api/football.php
php -l backend/api/league-data.php
php -l backend/api/fpl.php
php -l backend/api/player-details.php
php -l backend/src/api/config.php
```