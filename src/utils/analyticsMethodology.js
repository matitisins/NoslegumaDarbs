/*
 * Analytics methodology
 *
 * These weights are transparent, author-defined heuristics for comparing
 * players. They are NOT machine-learned probabilities and are not presented
 * as statistically estimated probabilities.
 *
 * Design principles:
 * - Goals/assists reward direct attacking contribution.
 * - Flow points represent the project's combined fantasy-performance signal.
 * - Minutes reward players with a larger observed sample/opportunity.
 * - Rating adds an external performance-quality signal.
 * - Key passes support the creator profile.
 * - Tackles/interceptions support the defensive profile.
 *
 * Every preset totals 100%. The weightedScore function also normalizes the
 * active weights, so custom sliders remain valid even when their total is
 * not exactly 100%.
 */

const RANKING_PRESETS = {
  balanced: {
    goals: 25,
    assists: 20,
    points: 35,
    minutes: 10,
    rating: 10,
  },
  attacking: {
    goals: 40,
    assists: 25,
    points: 25,
    minutes: 5,
    rating: 5,
  },
  form: {
    goals: 10,
    assists: 15,
    points: 45,
    minutes: 5,
    rating: 25,
  },
  creator: {
    goals: 10,
    assists: 40,
    points: 25,
    minutes: 10,
    rating: 15,
  },
  consistency: {
    goals: 15,
    assists: 15,
    points: 25,
    minutes: 30,
    rating: 15,
  },
};

const RANKING_PRESET_RATIONALES = {
  balanced:
    "Līdzsvarots modelis: lielākais svars Flow punktiem, bet vārti, piespēles, minūtes un vērtējums papildina kopējo snieguma ainu.",
  attacking:
    "Uzbrukuma modelis: lielāks uzsvars uz vārtiem un piespēlēm, jo mērķis ir atrast tiešāku uzbrukuma pienesumu.",
  form:
    "Formas modelis: lielāks Flow punktu un vidējā vērtējuma svars, lai vairāk ietekmētu pašreizējā snieguma signālus.",
  creator:
    "Radošuma modelis: lielākais svars piespēlēm, papildinot tās ar key passes un kopējiem Flow punktiem.",
  consistency:
    "Stabilitātes modelis: lielāks minūšu svars, lai dotu priekšroku spēlētājiem ar regulārāku spēles laiku.",
};

const RECOMMENDATION_STYLES = {
  attacking: {
    goals: 35,
    assists: 25,
    points: 30,
    rating: 10,
  },
  balanced: {
    goals: 25,
    assists: 20,
    points: 35,
    minutes: 10,
    rating: 10,
  },
  creator: {
    assists: 35,
    keyPasses: 30,
    points: 25,
    rating: 10,
  },
  defensive: {
    tackles: 25,
    interceptions: 25,
    points: 30,
    rating: 20,
  },
  goalscorer: {
    goals: 55,
    points: 25,
    rating: 10,
    minutes: 10,
  },
  form: {
    points: 60,
    rating: 25,
    minutes: 15,
  },
  value: {
    points: 40,
    goals: 20,
    assists: 15,
    minutes: 15,
    rating: 10,
  },
  allround: {
    goals: 20,
    assists: 20,
    points: 30,
    minutes: 15,
    rating: 15,
  },
};

const RECOMMENDATION_STYLE_RATIONALES = {
  attacking:
    "Uzsvars uz vārtiem, piespēlēm un kopējiem Flow punktiem, lai atrastu uzbrukuma pienesumu.",
  balanced:
    "Līdzsvaro tiešo uzbrukuma statistiku ar Flow punktiem, spēles laiku un vērtējumu.",
  creator:
    "Uzsvars uz piespēlēm un key passes, jo tie labāk raksturo radošo pienesumu.",
  defensive:
    "Uzsvars uz tackles un interceptions, papildinot tos ar Flow punktiem un vērtējumu.",
  goalscorer:
    "Lielākais svars vārtiem; pārējie rādītāji palīdz novērtēt kopējo kvalitāti un spēles laiku.",
  form:
    "Lielākais svars Flow punktiem un vērtējumam, lai prioritizētu pašreizējo sniegumu.",
  value:
    "Apvieno punktus, uzbrukuma pienesumu un spēles laiku, lai atrastu potenciāli labu vērtību.",
  allround:
    "Vienmērīgāk sadala svaru starp uzbrukumu, Flow punktiem, spēles laiku un vērtējumu.",
};

const getWeightTotal = weights =>
  Object.values(weights || {}).reduce((total, value) => {
    const parsed = Number(value);
    return total + (Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
  }, 0);

export {
  RANKING_PRESETS,
  RANKING_PRESET_RATIONALES,
  RECOMMENDATION_STYLES,
  RECOMMENDATION_STYLE_RATIONALES,
  getWeightTotal,
};