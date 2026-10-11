import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeFavoriteId,
  sanitizeFavoriteIds,
  sanitizeFavoritePlayers,
  readFavoriteIds,
  writeFavoriteIds,
  readFavoritePlayers,
  writeFavoritePlayers,
  isFavoriteId,
  toggleFavoriteId,
  upsertFavoritePlayer,
  removeFavoritePlayer,
} from "../src/utils/favoriteUtils.js";

const createStorage = initialValues => {
  const values = new Map(
    Object.entries(initialValues || {})
  );

  return {
    getItem(key) {
      return values.has(key)
        ? values.get(key)
        : null;
    },
    setItem(key, nextValue) {
      values.set(key, nextValue);
    },
    getValue(key) {
      return values.has(key)
        ? values.get(key)
        : null;
    },
  };
};

test("normalizeFavoriteId converts numeric and string ids to the same value", () => {
  assert.equal(normalizeFavoriteId(123), "123");
  assert.equal(normalizeFavoriteId(" 123 "), "123");
  assert.equal(normalizeFavoriteId(null), "");
  assert.equal(normalizeFavoriteId(undefined), "");
});

test("sanitizeFavoriteIds rejects non-arrays, removes invalid ids, and deduplicates", () => {
  assert.deepEqual(
    sanitizeFavoriteIds([
      123,
      "123",
      " 456 ",
      null,
      "",
      undefined,
    ]),
    ["123", "456"]
  );

  assert.deepEqual(
    sanitizeFavoriteIds({ ids: [1, 2] }),
    []
  );

  assert.deepEqual(
    sanitizeFavoriteIds(null),
    []
  );
});

test("sanitizeFavoritePlayers keeps valid player objects and normalizes ids", () => {
  const players = sanitizeFavoritePlayers([
    { id: 123, name: "Player One" },
    { id: " 456 ", name: "Player Two" },
    null,
    { name: "Missing ID" },
  ]);

  assert.deepEqual(players, [
    { id: "123", name: "Player One" },
    { id: "456", name: "Player Two" },
  ]);
});

test("sanitizeFavoritePlayers deduplicates players by normalized id", () => {
  const players = sanitizeFavoritePlayers([
    { id: 123, name: "Old Name" },
    { id: "123", name: "New Name" },
  ]);

  assert.deepEqual(players, [
    { id: "123", name: "New Name" },
  ]);
});

test("readFavoriteIds safely handles malformed JSON", () => {
  const storage = createStorage({
    flow_favorite_players: "not-valid-json",
  });

  assert.deepEqual(
    readFavoriteIds(storage),
    []
  );
});

test("readFavoriteIds safely handles valid JSON with the wrong data type", () => {
  const storage = createStorage({
    flow_favorite_players:
      JSON.stringify({ ids: [1, 2] }),
  });

  assert.deepEqual(
    readFavoriteIds(storage),
    []
  );
});

test("readFavoriteIds normalizes valid stored ids", () => {
  const storage = createStorage({
    flow_favorite_players:
      JSON.stringify([1, "2", " 3 ", 2]),
  });

  assert.deepEqual(
    readFavoriteIds(storage),
    ["1", "2", "3"]
  );
});

test("writeFavoriteIds stores sanitized ids", () => {
  const storage = createStorage();

  assert.equal(
    writeFavoriteIds(
      [1, "1", 2, null],
      storage
    ),
    true
  );

  assert.equal(
    storage.getValue("flow_favorite_players"),
    JSON.stringify(["1", "2"])
  );
});

test("writeFavoriteIds returns false when storage rejects the write", () => {
  const storage = {
    setItem() {
      throw new Error("Quota exceeded");
    },
  };

  assert.equal(
    writeFavoriteIds([1], storage),
    false
  );
});

test("readFavoritePlayers safely handles malformed JSON", () => {
  const storage = createStorage({
    flow_favorite_player_data:
      "not-valid-json",
  });

  assert.deepEqual(
    readFavoritePlayers(storage),
    []
  );
});

test("readFavoritePlayers safely handles a non-array value", () => {
  const storage = createStorage({
    flow_favorite_player_data:
      JSON.stringify({ player: { id: 1 } }),
  });

  assert.deepEqual(
    readFavoritePlayers(storage),
    []
  );
});

test("writeFavoritePlayers stores normalized player snapshots", () => {
  const storage = createStorage();

  assert.equal(
    writeFavoritePlayers(
      [
        { id: 123, name: "Player One" },
        { id: "123", name: "Updated Player One" },
      ],
      storage
    ),
    true
  );

  assert.deepEqual(
    JSON.parse(
      storage.getValue(
        "flow_favorite_player_data"
      )
    ),
    [
      {
        id: "123",
        name: "Updated Player One",
      },
    ]
  );
});

test("writeFavoritePlayers returns false when storage rejects the write", () => {
  const storage = {
    setItem() {
      throw new Error("Quota exceeded");
    },
  };

  assert.equal(
    writeFavoritePlayers(
      [{ id: 1, name: "Player" }],
      storage
    ),
    false
  );
});

test("isFavoriteId compares ids after normalization", () => {
  assert.equal(
    isFavoriteId([123, 456], "123"),
    true
  );
  assert.equal(
    isFavoriteId([123, 456], 456),
    true
  );
  assert.equal(
    isFavoriteId([123, 456], "789"),
    false
  );
  assert.equal(
    isFavoriteId([123], null),
    false
  );
});

test("toggleFavoriteId adds a normalized id without duplicates", () => {
  assert.deepEqual(
    toggleFavoriteId([123], " 456 "),
    ["123", "456"]
  );

  assert.deepEqual(
    toggleFavoriteId([123, "123"], 123),
    []
  );
});

test("toggleFavoriteId ignores players without a valid id", () => {
  assert.deepEqual(
    toggleFavoriteId([1, 2], null),
    ["1", "2"]
  );

  assert.deepEqual(
    toggleFavoriteId([1, 2], ""),
    ["1", "2"]
  );
});

test("upsertFavoritePlayer adds a player snapshot", () => {
  assert.deepEqual(
    upsertFavoritePlayer(
      [],
      { id: 123, name: "Player", team: "Team A" },
      { favoriteLeague: "PL" }
    ),
    [
      {
        id: "123",
        name: "Player",
        team: "Team A",
        favoriteLeague: "PL",
      },
    ]
  );
});

test("upsertFavoritePlayer updates an existing player snapshot", () => {
  assert.deepEqual(
    upsertFavoritePlayer(
      [
        {
          id: "123",
          name: "Old Name",
          flowPoints: 10,
        },
      ],
      {
        id: 123,
        name: "New Name",
        flowPoints: 20,
      }
    ),
    [
      {
        id: "123",
        name: "New Name",
        flowPoints: 20,
      },
    ]
  );
});

test("removeFavoritePlayer removes a player after id normalization", () => {
  assert.deepEqual(
    removeFavoritePlayer(
      [
        { id: "123", name: "Player One" },
        { id: "456", name: "Player Two" },
      ],
      123
    ),
    [
      { id: "456", name: "Player Two" },
    ]
  );
});

test("favorite player snapshots can be displayed without the current league data", () => {
  const favoritePlayers = [
    {
      id: "123",
      name: "Premier League Player",
      team: "Team A",
      favoriteLeague: "PL",
    },
  ];

  const currentLeaguePlayers = [
    {
      id: "999",
      name: "Different League Player",
      team: "Team B",
    },
  ];

  const currentIds = new Set(
    currentLeaguePlayers.map(player =>
      normalizeFavoriteId(player.id)
    )
  );

  const visibleFavorites =
    favoritePlayers.map(player =>
      currentIds.has(normalizeFavoriteId(player.id))
        ? currentLeaguePlayers.find(
            currentPlayer =>
              normalizeFavoriteId(
                currentPlayer.id
              ) === normalizeFavoriteId(player.id)
          )
        : player
    );

  assert.deepEqual(
    visibleFavorites,
    favoritePlayers
  );
});