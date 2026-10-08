import test from "node:test";
import assert from "node:assert/strict";

import {
  categoryLabel,
  getMetric,
  normalize,
  weightedScore,
  formationPositions,
  formationNames,
  playerRecentForm,
  getProjectedPoints,
  getFormStatus,
  getFlowValue,
  getBudgetPrice,
  getPositionStrength,
  sortByProjection,
  getBestForCategory,
  normalizeTeamName,
  resolvePlayerTeam,
  getFixtureForTeam,
  getFixtureOpponent,
  getDifficulty,
  getDifferentialScore,
  getStatusForPlayer,
} from "../src/utils/analyticsUtils.js";

test("categoryLabel returns Latvian labels for known categories", () => {
  assert.equal(categoryLabel("GOALKEEPERS"), "Vārtsargi");
  assert.equal(categoryLabel("STRIKERS"), "Uzbrucēji");
  assert.equal(categoryLabel("UNKNOWN"), "UNKNOWN");
});

test("getMetric reads regular and advanced player statistics", () => {
  const player = {
    goals: 8,
    flowPoints: 42,
    advancedStats: {
      rating: 7.4,
      keyPasses: 31,
    },
  };

  assert.equal(getMetric(player, "goals"), 8);
  assert.equal(getMetric(player, "points"), 42);
  assert.equal(getMetric(player, "rating"), 7.4);
  assert.equal(getMetric(player, "keyPasses"), 31);
  assert.equal(getMetric(player, "missing"), 0);
});

test("normalize returns a midpoint for equal min and max", () => {
  assert.equal(normalize(10, 10, 10), 50);
  assert.equal(normalize(15, 10, 20), 50);
});

test("weightedScore produces a normalized ranking score rather than probability", () => {
  const pool = [
    { id: 1, goals: 2, assists: 4 },
    { id: 2, goals: 6, assists: 8 },
    { id: 3, goals: 10, assists: 12 },
  ];

  const score = weightedScore(pool[2], { goals: 1, assists: 1 }, pool);
  assert.equal(score, 100);
  assert.ok(score >= 0 && score <= 100);
});

test("playerRecentForm prefers explicit recent form values", () => {
  const player = {
    recentForm: [
      { value: 4 },
      { flowPoints: 6 },
      { points: 8 },
    ],
    appearances: 20,
    flowPoints: 100,
  };

  assert.deepEqual(playerRecentForm(player), [4, 6, 8]);
  assert.equal(getProjectedPoints(player), 6);
});

test("getProjectedPoints falls back to season points per appearance", () => {
  assert.equal(getProjectedPoints({ appearances: 10, flowPoints: 70 }), 7);
  assert.equal(getProjectedPoints({ appearances: 0, flowPoints: 12 }), 12);
  assert.equal(getProjectedPoints({ appearances: 0, flowPoints: 0 }), 0);
});

test("getFormStatus classifies projected form into stable ranges", () => {
  assert.match(getFormStatus({ recentForm: [9] }).label, /Karsta forma/);
  assert.match(getFormStatus({ recentForm: [7] }).label, /Laba forma/);
  assert.match(getFormStatus({ recentForm: [5] }).label, /Vidēja forma/);
  assert.match(getFormStatus({ recentForm: [2] }).label, /Vāja forma/);
});

test("getFlowValue and getBudgetPrice return finite values", () => {
  const player = {
    category: "STRIKERS",
    recentForm: [8, 9, 7],
    appearances: 20,
    minutes: 1600,
    goals: 12,
    assists: 6,
    advancedStats: { rating: 7.2 },
  };

  const flowValue = getFlowValue(player);
  const budgetPrice = getBudgetPrice(player);

  assert.ok(Number.isFinite(flowValue));
  assert.ok(flowValue > 0);
  assert.equal(budgetPrice, flowValue);
});

test("getPositionStrength returns a bounded score", () => {
  const players = [
    { category: "MIDFIELDERS", recentForm: [5] },
    { category: "MIDFIELDERS", recentForm: [7] },
    { category: "STRIKERS", recentForm: [10] },
  ];

  assert.equal(getPositionStrength(players, "MIDFIELDERS"), 60);
  assert.equal(getPositionStrength(players, "DEFENDERS"), 0);
});

test("sortByProjection orders players from highest to lowest projection", () => {
  const players = [
    { id: 1, recentForm: [5] },
    { id: 2, recentForm: [9] },
    { id: 3, recentForm: [7] },
  ];

  assert.deepEqual(sortByProjection(players).map(player => player.id), [2, 3, 1]);
});

test("getBestForCategory filters by category and excluded ids", () => {
  const players = [
    { id: 1, category: "MIDFIELDERS", recentForm: [7] },
    { id: 2, category: "MIDFIELDERS", recentForm: [9] },
    { id: 3, category: "STRIKERS", recentForm: [10] },
  ];

  assert.equal(getBestForCategory(players, "MIDFIELDERS").id, 2);
  assert.equal(getBestForCategory(players, "MIDFIELDERS", new Set(["2"])).id, 1);
  assert.equal(getBestForCategory(players, "DEFENDERS"), null);
});

test("formation definitions contain eleven positions", () => {
  assert.ok(formationNames.length >= 5);
  for (const name of formationNames) {
    assert.equal(formationPositions[name].length, 11);
  }
});

test("normalizeTeamName removes FC and normalizes punctuation", () => {
  assert.equal(normalizeTeamName("FC Arsenal!"), "arsenal");
  assert.equal(normalizeTeamName("Manchester-United"), "manchester united");
});

test("resolvePlayerTeam resolves a missing team id from standings", () => {
  const player = { id: 1, team: "Arsenal" };
  const standings = [
    { team: { id: 42, name: "Arsenal FC" } },
  ];

  assert.equal(resolvePlayerTeam(player, standings).teamId, 42);
});

test("fixture helpers find the player's upcoming fixture and opponent", () => {
  const player = { id: 1, teamId: 10 };
  const fixtures = {
    upcoming: [
      {
        fixture: { venue: { name: "Stadium" } },
        teams: {
          home: { id: 10, name: "Home FC", logo: "home.png" },
          away: { id: 20, name: "Away FC", logo: "away.png" },
        },
      },
    ],
  };

  const fixture = getFixtureForTeam(player, fixtures);
  assert.ok(fixture);

  const opponent = getFixtureOpponent(player, fixture);
  assert.equal(opponent.name, "Away FC");
  assert.equal(opponent.isHome, true);
  assert.equal(opponent.venue, "Stadium");
});

test("getDifficulty returns a ranked difficulty based on opponent position", () => {
  const player = { teamId: 10 };
  const fixture = {
    teams: {
      home: { id: 10, name: "Home" },
      away: { id: 20, name: "Opponent" },
    },
  };
  const standings = [
    { position: 1, team: { id: 20, name: "Opponent" } },
  ];

  const difficulty = getDifficulty(player, fixture, standings);
  assert.equal(difficulty.score, 5);
  assert.equal(difficulty.opponentPosition, 1);
});

test("getDifferentialScore rewards strong projected form and playing time", () => {
  const players = [
    { id: 1, category: "STRIKERS", recentForm: [9], minutes: 900 },
    { id: 2, category: "STRIKERS", recentForm: [5], minutes: 300 },
  ];

  const score = getDifferentialScore(players[0], players);
  assert.ok(score > 0);
  assert.ok(score <= 45);
});

test("getStatusForPlayer distinguishes injured, regular and uncertain players", () => {
  assert.match(getStatusForPlayer({ injured: true }).label, /Traumas risks/);
  assert.match(getStatusForPlayer({ appearances: 10, minutes: 800 }).label, /Regulārs starteris/);
  assert.match(getStatusForPlayer({ appearances: 10, minutes: 400 }).label, /jāpārbauda/);
});