const toFiniteNumber = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Returns the player's fantasy-value baseline used by the captain simulator.
 *
 * FDR is intentionally NOT converted into an invented percentage modifier.
 * The project does not have enough historical data to justify a fixed
 * relationship such as "5% per FDR level". Keeping the baseline tied to the
 * supplied fantasy points avoids presenting an unsupported statistical claim.
 */
const getCaptainExpectedPoints = player => {
  if (!player) return 0;

  return Math.max(
    0,
    toFiniteNumber(player.points)
  );
};

/**
 * Applies the standard fantasy captain multiplier.
 */
const getCaptainValue = expectedPoints =>
  Math.max(0, toFiniteNumber(expectedPoints)) * 2;

export {
  toFiniteNumber,
  getCaptainExpectedPoints,
  getCaptainValue,
};