import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateSquadBudget,
  getFantasySquadConstraintViolations,
  isFantasyTeamValid,
  buildBudgetConstrainedXI,
} from "../src/utils/fantasyRules.js";

const price = player => player.price;
const projection = player => player.projection;

const makeValidSquad = () => {
  const players = [
    ...Array.from({ length: 2 }, (_, i) => ({ id: `gk-${i}`, category: "GOALKEEPERS", team: `gk-team-${i}`, price: 5 })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: `def-${i}`, category: "DEFENDERS", team: `def-team-${i}`, price: 5 })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: `mid-${i}`, category: "MIDFIELDERS", team: `mid-team-${i}`, price: 5 })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `fwd-${i}`, category: "STRIKERS", team: `fwd-team-${i}`, price: 5 })),
  ];

  return {
    players,
    startingPlayers: [
      players[0], players[2], players[3], players[4], players[5],
      players[7], players[8], players[9], players[11], players[12], players[13],
    ],
    benchPlayers: [players[1], players[6], players[10], players[14]],
  };
};

test("calculateSquadBudget sums starter and bench prices", () => {
  const players = [
    { id: 1, price: 10 },
    { id: 2, price: 8.5 },
    { id: 3, price: 6 },
  ];

  assert.equal(calculateSquadBudget(players, price), 24.5);
});

test("calculateSquadBudget ignores empty player entries", () => {
  const players = [
    { id: 1, price: 10 },
    null,
    undefined,
    { id: 2, price: "2.5" },
  ];

  assert.equal(calculateSquadBudget(players, price), 12.5);
});

test("fantasy team is invalid when budget is exceeded", () => {
  const result = isFantasyTeamValid({
    startingPlayers: Array.from({ length: 11 }, (_, index) => ({
      id: index + 1,
      category: index === 0 ? "GOALKEEPERS" : index < 5 ? "DEFENDERS" : index < 8 ? "MIDFIELDERS" : "STRIKERS",
      team: `team-${index}`,
      price: 10,
    })),
    benchPlayers: [
      { id: 12, category: "GOALKEEPERS", team: "bench-1", price: 1 },
      { id: 13, category: "DEFENDERS", team: "bench-2", price: 1 },
      { id: 14, category: "MIDFIELDERS", team: "bench-3", price: 1 },
      { id: 15, category: "STRIKERS", team: "bench-4", price: 1 },
    ],
    budget: 100,
    captainId: 1,
    viceCaptainId: 2,
    getPrice: price,
  });

  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes("Sastāva vērtība pārsniedz budžetu."));
});

test("fantasy team requires different captain and vice captain", () => {
  const { startingPlayers, benchPlayers } = makeValidSquad();
  const result = isFantasyTeamValid({
    startingPlayers,
    benchPlayers,
    budget: 100,
    captainId: startingPlayers[0].id,
    viceCaptainId: startingPlayers[0].id,
    getPrice: price,
  });

  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes("Kapteinis un vicekapteinis nevar būt viens spēlētājs."));
});

test("valid complete fantasy squad passes all constraints", () => {
  const { startingPlayers, benchPlayers } = makeValidSquad();
  const result = isFantasyTeamValid({
    startingPlayers,
    benchPlayers,
    budget: 100,
    captainId: startingPlayers[0].id,
    viceCaptainId: startingPlayers[1].id,
    getPrice: price,
  });

  assert.equal(result.valid, true);
  assert.equal(result.totalBudget, 75);
  assert.equal(result.reasons.length, 0);
});

test("fantasy squad rejects duplicate players", () => {
  const { startingPlayers, benchPlayers } = makeValidSquad();
  benchPlayers[0] = startingPlayers[0];

  const violations = getFantasySquadConstraintViolations({
    startingPlayers,
    benchPlayers,
    requireCompleteSquad: false,
  });

  assert.ok(violations.includes("Spēlētājs nevar būt izvēlēts vairāk nekā vienu reizi."));
});

test("fantasy squad rejects more than three players from one club", () => {
  const players = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    category: index < 2 ? "GOALKEEPERS" : index < 7 ? "DEFENDERS" : index < 12 ? "MIDFIELDERS" : "STRIKERS",
    team: "same-club",
    price: 5,
  }));

  const result = isFantasyTeamValid({
    startingPlayers: players.slice(0, 11),
    benchPlayers: players.slice(11),
    budget: 100,
    captainId: 1,
    viceCaptainId: 2,
    getPrice: price,
  });

  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes("No vienas komandas drīkst būt ne vairāk kā 3 spēlētāji."));
});

test("fantasy squad rejects invalid full squad position counts", () => {
  const players = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    category: index < 2 ? "GOALKEEPERS" : index < 8 ? "DEFENDERS" : index < 12 ? "MIDFIELDERS" : "STRIKERS",
    team: `team-${index}`,
    price: 5,
  }));

  const violations = getFantasySquadConstraintViolations({
    startingPlayers: players.slice(0, 11),
    benchPlayers: players.slice(11),
    requireCompleteSquad: true,
  });

  assert.ok(violations.some(reason => reason.includes("ne vairāk kā 5 defenders")));
});

test("fantasy squad requires four bench players when validation is complete", () => {
  const { startingPlayers, benchPlayers } = makeValidSquad();
  const result = isFantasyTeamValid({
    startingPlayers,
    benchPlayers: benchPlayers.slice(0, 3),
    budget: 100,
    captainId: startingPlayers[0].id,
    viceCaptainId: startingPlayers[1].id,
    getPrice: price,
  });

  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes("Jābūt 4 rezervistiem."));
});

test("starting XI must contain exactly one goalkeeper and valid outfield ranges", () => {
  const players = Array.from({ length: 15 }, (_, index) => ({
    id: index + 1,
    category: index < 2 ? "GOALKEEPERS" : index < 7 ? "DEFENDERS" : index < 12 ? "MIDFIELDERS" : "STRIKERS",
    team: `team-${index}`,
    price: 5,
  }));

  const violations = getFantasySquadConstraintViolations({
    startingPlayers: [
      players[0], players[1],
      players[2], players[3], players[4], players[5], players[6],
      players[7], players[8], players[12], players[13],
    ],
    benchPlayers: [players[9], players[10], players[11], players[14]],
    requireCompleteSquad: false,
  });

  assert.ok(violations.includes("Sākumsastāvā jābūt tieši 1 vārtsargam."));
});

test("budget constrained XI does not exceed the budget", () => {
  const slots = [
    { category: "GK" },
    { category: "DEF" },
    { category: "DEF" },
    { category: "MID" },
    { category: "MID" },
    { category: "FWD" },
  ];

  const players = [
    { id: 1, category: "GK", price: 5, projection: 7 },
    { id: 2, category: "GK", price: 6, projection: 9 },
    { id: 3, category: "DEF", price: 4, projection: 5 },
    { id: 4, category: "DEF", price: 5, projection: 8 },
    { id: 5, category: "DEF", price: 6, projection: 9 },
    { id: 6, category: "MID", price: 5, projection: 6 },
    { id: 7, category: "MID", price: 7, projection: 9 },
    { id: 8, category: "MID", price: 8, projection: 10 },
    { id: 9, category: "FWD", price: 6, projection: 8 },
    { id: 10, category: "FWD", price: 9, projection: 11 },
  ];

  const result = buildBudgetConstrainedXI({
    players,
    slots,
    budget: 33,
    getPrice: price,
    getProjection: projection,
  });

  assert.ok(result);
  assert.equal(result.length, slots.length);
  assert.ok(calculateSquadBudget(result, price) <= 33.0001);
});

test("budget constrained XI returns null when a required position has no candidates", () => {
  const result = buildBudgetConstrainedXI({
    players: [{ id: 1, category: "GK", price: 5, projection: 7 }],
    slots: [{ category: "GK" }, { category: "DEF" }],
    budget: 100,
    getPrice: price,
    getProjection: projection,
  });

  assert.equal(result, null);
});

test("budget constrained XI never selects more than three players from one club", () => {
  const players = [
    { id: 1, category: "GK", team: "club-a", price: 5, projection: 10 },
    { id: 2, category: "DEF", team: "club-a", price: 5, projection: 10 },
    { id: 3, category: "DEF", team: "club-a", price: 5, projection: 9 },
    { id: 4, category: "MID", team: "club-a", price: 5, projection: 10 },
    { id: 5, category: "MID", team: "club-b", price: 5, projection: 8 },
    { id: 6, category: "MID", team: "club-c", price: 5, projection: 7 },
    { id: 7, category: "FWD", team: "club-b", price: 5, projection: 8 },
    { id: 8, category: "FWD", team: "club-c", price: 5, projection: 7 },
  ];

  const result = buildBudgetConstrainedXI({
    players,
    slots: [
      { category: "GK" },
      { category: "DEF" },
      { category: "DEF" },
      { category: "MID" },
      { category: "MID" },
      { category: "FWD" },
    ],
    budget: 100,
    getPrice: price,
    getProjection: projection,
  });

  assert.ok(result);
  const clubACount = result.filter(player => player.team === "club-a").length;
  assert.ok(clubACount <= 3);
});