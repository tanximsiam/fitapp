import type { WorkoutExercise } from "@/types/journal";

/**
 * Exercises offered while typing, grouped by kind, each with a typical MET from the Compendium of Physical Activities.
 * Anything else the person types is allowed and counts as moderate effort (DEFAULT_MET).
 */
const GROUPS: [name: string, met: number][][] = [
  // Weights: chest, back, shoulders and arms
  [
    ["Bench press", 6],
    ["Incline bench press", 6],
    ["Dumbbell press", 5],
    ["Chest fly", 3.5],
    ["Cable crossover", 3.5],
    ["Lat pulldown", 5],
    ["Barbell row", 6],
    ["Dumbbell row", 5],
    ["Seated cable row", 5],
    ["Face pulls", 3.5],
    ["Deadlift", 6],
    ["Romanian deadlift", 6],
    ["Good mornings", 5],
    ["Shoulder press", 5],
    ["Arnold press", 5],
    ["Lateral raises", 3.5],
    ["Front raises", 3.5],
    ["Shrugs", 3.5],
    ["Bicep curls", 3.5],
    ["Hammer curls", 3.5],
    ["Tricep extensions", 3.5],
    ["Tricep pushdowns", 3.5],
    ["Skull crushers", 3.5],
    ["Clean and jerk", 6],
    ["Snatch", 6],
  ],
  // Bodyweight and core
  [
    ["Push-ups", 8],
    ["Pull-ups", 8],
    ["Chin-ups", 8],
    ["Dips", 8],
    ["Inverted row", 5],
    ["Plank", 3.8],
    ["Side plank", 3.8],
    ["Crunches", 3.8],
    ["Sit-ups", 3.8],
    ["Bicycle crunches", 3.8],
    ["Russian twists", 3.8],
    ["Leg raises", 3.8],
    ["Hanging leg raises", 4],
    ["Dead bug", 3],
    ["Ab wheel rollout", 4],
    ["Wall sit", 3.8],
  ],
  // Legs and glutes
  [
    ["Squats", 5],
    ["Front squats", 6],
    ["Goblet squats", 5],
    ["Bulgarian split squats", 5],
    ["Lunges", 5],
    ["Walking lunges", 5],
    ["Step-ups", 6],
    ["Leg press", 5],
    ["Leg extensions", 4],
    ["Leg curls", 4],
    ["Calf raises", 3.5],
    ["Hip thrusts", 5],
    ["Glute bridges", 3.5],
  ],
  // Conditioning and power
  [
    ["Burpees", 8],
    ["Jumping jacks", 7.7],
    ["Jump rope", 11.8],
    ["Kettlebell swings", 9.8],
    ["Kettlebell goblet squat", 5],
    ["Box jumps", 8],
    ["Thrusters", 8],
    ["Wall balls", 8],
    ["Battle ropes", 10.3],
    ["Farmer's walk", 6],
    ["Sled push", 8],
    ["Bear crawl", 8],
    ["Mountain climbers", 8],
    ["High knees", 8],
    ["Sprints", 12],
    ["Circuit training", 8],
    ["HIIT", 8],
    ["CrossFit WOD", 8],
  ],
  // Gym cardio machines
  [
    ["Treadmill", 7],
    ["Rowing machine", 7],
    ["Stationary bike", 6.8],
    ["Elliptical", 5],
    ["Stair climber", 9],
    ["Spin class", 8.5],
  ],
  // Mobility
  [
    ["Stretching", 2.3],
    ["Mobility drills", 2.5],
    ["Pilates", 3],
    ["Foam rolling", 2],
  ],
  // Combat
  [
    ["Boxing (bag)", 5.5],
    ["Shadow boxing", 5],
    ["Kickboxing", 7.3],
  ],
];

export const EXERCISES: { name: string; met: number }[] = GROUPS.flat().map(
  ([name, met]) => ({ name, met })
);

export const DEFAULT_MET = 5;
/** Minutes per set when a row has no time of its own, rest included. */
export const MINUTES_PER_SET = 2;

const byName = new Map(EXERCISES.map((e) => [e.name.toLowerCase(), e]));
const find = (name: string) => byName.get(name.trim().toLowerCase());

export const exerciseMet = (name: string) => find(name)?.met ?? DEFAULT_MET;

/** Up to `limit` names containing the query, those starting with it first. */
export function searchExercises(query: string, limit = 6) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits = EXERCISES.filter((e) => e.name.toLowerCase().includes(q));
  return [
    ...hits.filter((e) => e.name.toLowerCase().startsWith(q)),
    ...hits.filter((e) => !e.name.toLowerCase().startsWith(q)),
  ].slice(0, limit);
}

/** The row's own time, or two minutes per set. */
export const exerciseMinutes = (
  x: Pick<WorkoutExercise, "sets" | "durationMin">
) => x.durationMin ?? x.sets * MINUTES_PER_SET;
