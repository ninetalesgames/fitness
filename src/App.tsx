import { useEffect, useMemo, useState } from "react";
import "./App.css";

type DayKey =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

type DayType =
  | "WFH"
  | "Office"
  | "Office + Gym"
  | "Football"
  | "Tennis"
  | "Free"
  | "Rest";

type WorkoutType =
  | "Home Upper A"
  | "Home Upper B"
  | "Office Pull Gym"
  | "Football"
  | "Tennis"
  | "Free Day Core"
  | "Recovery"
  | "Rest";

type WeeklyPlan = Record<DayKey, DayType>;

type ExerciseDef = {
  id: string;
  name: string;
  reps?: number;
  seconds?: number;
  sets: number;
};

type DailyWorkoutSnapshot = {
  workout: WorkoutType;
  displayName: string;
  level: number;
  tier: number;
  exercises: ExerciseDef[];
};

type BonusWorkout = {
  id: string;
  title: string;
  description: string;
  xp: number;
};

type AppState = {
  xp: number;
  level: number;
  streak: number;
  totalSessions: number;
  lastCompletedDate: string | null;
  upperRotation: "A" | "B";
  completedExerciseIdsByDate: Record<string, string[]>;
  completedBonusIdsByDate: Record<string, string[]>;
  dailyWorkoutSnapshotByDate: Record<string, DailyWorkoutSnapshot>;
};

const XP_PER_LEVEL = 100;
const BONUS_XP_CAP_PER_DAY = 12;

const MASCOT_FILES = ["icon.png", "wave.png", "nerd.png", "cool.png"];

const getMascotForDate = (dateString: string) => {
  const hash = dateString
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const file = MASCOT_FILES[hash % MASCOT_FILES.length];
  return `${import.meta.env.BASE_URL}${file}`;
};

const dayNames: DayKey[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const shortDayNames: Record<DayKey, string> = {
  Sunday: "Sun",
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
};

const dayTypeOptions: DayType[] = [
  "WFH",
  "Office",
  "Office + Gym",
  "Football",
  "Tennis",
  "Free",
  "Rest",
];

const defaultPlan: WeeklyPlan = {
  Sunday: "Free",
  Monday: "WFH",
  Tuesday: "WFH",
  Wednesday: "Football",
  Thursday: "Tennis",
  Friday: "Office + Gym",
  Saturday: "Rest",
};

const defaultState: AppState = {
  xp: 0,
  level: 1,
  streak: 0,
  totalSessions: 0,
  lastCompletedDate: null,
  upperRotation: "A",
  completedExerciseIdsByDate: {},
  completedBonusIdsByDate: {},
  dailyWorkoutSnapshotByDate: {},
};

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayFriendlyDate = () => {
  const today = new Date();
  return today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const getYesterdayString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = `${yesterday.getMonth() + 1}`.padStart(2, "0");
  const day = `${yesterday.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayDayName = (): DayKey => {
  return dayNames[new Date().getDay()];
};

const getWorkoutForDayType = (
  dayType: DayType,
  rotation: "A" | "B"
): WorkoutType => {
  switch (dayType) {
    case "WFH":
      return rotation === "A" ? "Home Upper A" : "Home Upper B";
    case "Office":
      return "Recovery";
    case "Office + Gym":
      return "Office Pull Gym";
    case "Football":
      return "Football";
    case "Tennis":
      return "Tennis";
    case "Free":
      return "Free Day Core";
    case "Rest":
      return "Rest";
    default:
      return "Rest";
  }
};

const getWorkoutDisplayName = (workout: WorkoutType): string => {
  switch (workout) {
    case "Home Upper A":
    case "Home Upper B":
      return "Upper Body";
    case "Office Pull Gym":
      return "Pull Day";
    case "Football":
      return "Football";
    case "Tennis":
      return "Tennis";
    case "Free Day Core":
      return "Core";
    case "Recovery":
      return "Recovery";
    case "Rest":
      return "Rest Day";
    default:
      return "Training";
  }
};

const getBaseWorkoutExercises = (workout: WorkoutType): ExerciseDef[] => {
  switch (workout) {
    case "Home Upper A":
      return [
        { id: "pushups", name: "Push ups", reps: 12, sets: 1 },
        { id: "incline_pushups", name: "Incline push ups", reps: 10, sets: 1 },
        { id: "pike_pushups", name: "Pike push ups", reps: 8, sets: 1 },
        { id: "chair_dips", name: "Chair dips", reps: 12, sets: 1 },
        { id: "situps", name: "Sit ups", reps: 15, sets: 1 },
        { id: "plank", name: "Plank", seconds: 30, sets: 1 },
      ];

    case "Home Upper B":
      return [
        {
          id: "close_grip_pushups",
          name: "Close grip push ups",
          reps: 10,
          sets: 1,
        },
        { id: "slow_pushups", name: "Slow push ups", reps: 8, sets: 1 },
        { id: "chair_dips_b", name: "Chair dips", reps: 10, sets: 1 },
        { id: "leg_raises", name: "Leg raises", reps: 12, sets: 1 },
        {
          id: "shoulder_taps",
          name: "Shoulder taps each side",
          reps: 20,
          sets: 1,
        },
        { id: "plank_b", name: "Plank", seconds: 35, sets: 1 },
      ];

    case "Office Pull Gym":
      return [
        { id: "lat_pulldown", name: "Lat pulldown", reps: 10, sets: 3 },
        { id: "seated_row", name: "Seated row", reps: 10, sets: 3 },
        {
          id: "dumbbell_row",
          name: "Dumbbell row each side",
          reps: 10,
          sets: 3,
        },
        { id: "bicep_curls", name: "Bicep curls", reps: 12, sets: 3 },
        { id: "rear_delt_fly", name: "Rear delt fly", reps: 12, sets: 3 },
      ];

    case "Football":
      return [
        { id: "football_session", name: "Play football", reps: 1, sets: 1 },
        {
          id: "football_focus",
          name: "Focus on intensity and movement",
          reps: 1,
          sets: 1,
        },
      ];

    case "Tennis":
      return [
        { id: "tennis_session", name: "Play tennis", reps: 1, sets: 1 },
        {
          id: "tennis_focus",
          name: "Focus on movement and consistency",
          reps: 1,
          sets: 1,
        },
      ];

    case "Free Day Core":
      return [
        { id: "situps_core", name: "Sit ups", reps: 20, sets: 1 },
        { id: "leg_raises_core", name: "Leg raises", reps: 12, sets: 1 },
        { id: "plank_core", name: "Plank", seconds: 30, sets: 1 },
        {
          id: "side_plank",
          name: "Side plank each side",
          seconds: 20,
          sets: 1,
        },
        { id: "mobility", name: "Mobility", seconds: 300, sets: 1 },
      ];

    case "Recovery":
      return [
        { id: "walk", name: "Walk", seconds: 600, sets: 1 },
        { id: "stretch", name: "Stretch", seconds: 300, sets: 1 },
        {
          id: "light_mobility",
          name: "Light mobility",
          seconds: 300,
          sets: 1,
        },
      ];

    case "Rest":
      return [];

    default:
      return [];
  }
};

const getDifficultyTier = (level: number) => {
  if (level >= 13) return 5;
  if (level >= 10) return 4;
  if (level >= 7) return 3;
  if (level >= 4) return 2;
  return 1;
};

const scaleExerciseForLevel = (
  exercise: ExerciseDef,
  level: number,
  workout: WorkoutType
): ExerciseDef => {
  if (
    workout === "Office Pull Gym" ||
    workout === "Football" ||
    workout === "Tennis" ||
    workout === "Recovery" ||
    workout === "Rest"
  ) {
    return exercise;
  }

  const tier = getDifficultyTier(level);

  if (tier === 1) {
    return exercise;
  }

  if (tier === 2) {
    return {
      ...exercise,
      reps: exercise.reps !== undefined ? exercise.reps + 2 : undefined,
      seconds:
        exercise.seconds !== undefined ? exercise.seconds + 5 : undefined,
    };
  }

  if (tier === 3) {
    return {
      ...exercise,
      reps:
        exercise.reps !== undefined
          ? Math.max(6, Math.floor(exercise.reps * 0.7))
          : undefined,
      seconds:
        exercise.seconds !== undefined
          ? Math.max(20, Math.floor(exercise.seconds * 0.7))
          : undefined,
      sets: 2,
    };
  }

  if (tier === 4) {
    return {
      ...exercise,
      reps:
        exercise.reps !== undefined
          ? Math.max(7, Math.floor(exercise.reps * 0.85))
          : undefined,
      seconds:
        exercise.seconds !== undefined
          ? Math.max(25, Math.floor(exercise.seconds * 0.85))
          : undefined,
      sets: 2,
    };
  }

  return {
    ...exercise,
    reps: exercise.reps,
    seconds: exercise.seconds,
    sets: 2,
  };
};

const getScaledWorkoutExercises = (
  workout: WorkoutType,
  level: number
): ExerciseDef[] => {
  const baseExercises = getBaseWorkoutExercises(workout);
  return baseExercises.map((exercise) =>
    scaleExerciseForLevel(exercise, level, workout)
  );
};

const formatExerciseLabel = (exercise: ExerciseDef): string => {
  if (
    exercise.id === "football_session" ||
    exercise.id === "football_focus" ||
    exercise.id === "tennis_session" ||
    exercise.id === "tennis_focus"
  ) {
    return exercise.name;
  }

  if (
    exercise.id === "mobility" ||
    exercise.id === "walk" ||
    exercise.id === "stretch" ||
    exercise.id === "light_mobility"
  ) {
    const minutes = Math.floor((exercise.seconds || 0) / 60);
    return `${minutes} minute ${exercise.name.toLowerCase()} x${exercise.sets}`;
  }

  if (exercise.seconds !== undefined) {
    return `${exercise.seconds} second ${exercise.name.toLowerCase()} x${exercise.sets}`;
  }

  return `${exercise.reps} ${exercise.name.toLowerCase()} x${exercise.sets}`;
};

const getStepXp = (workout: WorkoutType): number => {
  switch (workout) {
    case "Home Upper A":
    case "Home Upper B":
      return 10;
    case "Office Pull Gym":
      return 12;
    case "Football":
      return 15;
    case "Tennis":
      return 13;
    case "Free Day Core":
      return 9;
    case "Recovery":
      return 7;
    case "Rest":
      return 0;
    default:
      return 10;
  }
};

const getBonusWorkoutsForMainWorkout = (
  workout: WorkoutType,
  level: number
): BonusWorkout[] => {
  const tier = getDifficultyTier(level);

  const common: BonusWorkout[] = [
    {
      id: "bonus_walk",
      title: "Walk",
      description: "10 minute easy walk",
      xp: 3,
    },
    {
      id: "bonus_stretch",
      title: "Stretch",
      description: "5 minute full body stretch",
      xp: 3,
    },
    {
      id: "bonus_mobility",
      title: "Mobility Reset",
      description: "6 minute mobility flow",
      xp: 3,
    },
  ];

  if (workout === "Football" || workout === "Tennis") {
    return [
      {
        id: "bonus_cooldown",
        title: "Cooldown",
        description: "5 minute cooldown walk and breathing",
        xp: 3,
      },
      {
        id: "bonus_hips",
        title: "Hip Mobility",
        description: "5 minute hips and ankles reset",
        xp: 3,
      },
      {
        id: "bonus_core_light",
        title: "Light Core",
        description: `Plank hold ${tier >= 3 ? "45" : "30"} seconds`,
        xp: 3,
      },
    ];
  }

  if (workout === "Office Pull Gym") {
    return [
      {
        id: "bonus_carry",
        title: "Grip Finisher",
        description: "2 extra carry or hold rounds",
        xp: 4,
      },
      {
        id: "bonus_stretch_lats",
        title: "Lat Stretch",
        description: "Upper back and lat stretch",
        xp: 3,
      },
      {
        id: "bonus_walk_home",
        title: "Extra Walk",
        description: "10 minute easy walk",
        xp: 3,
      },
    ];
  }

  if (workout === "Rest") {
    return [
      {
        id: "bonus_fresh_air",
        title: "Fresh Air",
        description: "10 minute relaxed walk",
        xp: 3,
      },
      {
        id: "bonus_gentle_stretch",
        title: "Gentle Stretch",
        description: "5 minute recovery stretch",
        xp: 3,
      },
    ];
  }

  return [
    {
      id: "bonus_core_finisher",
      title: "Core Finisher",
      description: `Plank and sit ups mini finisher`,
      xp: 4,
    },
    ...common,
  ];
};

const getBonusXpEarnedToday = (
  completedBonusIds: string[],
  availableBonuses: BonusWorkout[]
) => {
  return completedBonusIds.reduce((total, id) => {
    const found = availableBonuses.find((bonus) => bonus.id === id);
    return total + (found?.xp || 0);
  }, 0);
};

const getDayTypeColorClass = (dayType: DayType) => {
  switch (dayType) {
    case "WFH":
      return "type-pill type-wfh";
    case "Office":
      return "type-pill type-office";
    case "Office + Gym":
      return "type-pill type-gym";
    case "Football":
      return "type-pill type-football";
    case "Tennis":
      return "type-pill type-tennis";
    case "Free":
      return "type-pill type-free";
    case "Rest":
      return "type-pill type-rest";
    default:
      return "type-pill";
  }
};

type MascotProps = {
  mood?: "idle" | "happy";
  size?: number;
  src: string;
};

function Mascot({ mood = "idle", size = 96, src }: MascotProps) {
  return (
    <div
      className={`mascot-wrap ${mood === "happy" ? "mascot-happy" : ""}`}
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt=""
        className="mascot-img"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

function SectionIcon({ size = 24, src }: { size?: number; src: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}

type ProgressRingProps = {
  completed: number;
  total: number;
};

function ProgressRing({ completed, total }: ProgressRingProps) {
  const safeTotal = Math.max(total, 1);
  const percent = completed / safeTotal;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent);

  return (
    <div className="progress-ring-card">
      <svg className="progress-ring" viewBox="0 0 140 140">
        <circle
          className="progress-ring-track"
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="12"
        />
        <circle
          className="progress-ring-fill"
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 70 70)"
        />
      </svg>

      <div className="progress-ring-center">
        <strong>
          {completed}/{total}
        </strong>
        <span>done</span>
      </div>
    </div>
  );
}

function App() {
  const [state, setState] = useState<AppState>(defaultState);
  const [plan, setPlan] = useState<WeeklyPlan>(defaultPlan);
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const [message, setMessage] = useState("Ready for today’s mission.");
  const [mascotMood, setMascotMood] = useState<"idle" | "happy">("idle");
  const [floatingXp, setFloatingXp] = useState<number | null>(null);

  const todayDate = getTodayString();
  const todayFriendlyDate = getTodayFriendlyDate();
  const todayDay = getTodayDayName();
  const todayDayType = plan[todayDay];
  const mascotSrc = getMascotForDate(todayDate);

  const liveWorkout = useMemo(() => {
    return getWorkoutForDayType(todayDayType, state.upperRotation);
  }, [todayDayType, state.upperRotation]);

  const liveWorkoutDisplay = useMemo(() => {
    return getWorkoutDisplayName(liveWorkout);
  }, [liveWorkout]);

  const liveExercises = useMemo(() => {
    return getScaledWorkoutExercises(liveWorkout, state.level);
  }, [liveWorkout, state.level]);

  const todaysSnapshot = state.dailyWorkoutSnapshotByDate[todayDate];

  const todaysWorkout = todaysSnapshot?.workout ?? liveWorkout;
  const todaysWorkoutDisplay = todaysSnapshot?.displayName ?? liveWorkoutDisplay;
  const todaysExercises = todaysSnapshot?.exercises ?? liveExercises;
  const currentTier = todaysSnapshot?.tier ?? getDifficultyTier(state.level);

  const todaysCompletedExerciseIds =
    state.completedExerciseIdsByDate[todayDate] || [];
  const todaysCompletedBonusIds = state.completedBonusIdsByDate[todayDate] || [];

  const completedCount = todaysCompletedExerciseIds.length;
  const totalCount = todaysExercises.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  const availableBonusWorkouts = useMemo(() => {
    return getBonusWorkoutsForMainWorkout(todaysWorkout, state.level);
  }, [todaysWorkout, state.level]);

  const bonusXpEarnedToday = useMemo(() => {
    return getBonusXpEarnedToday(
      todaysCompletedBonusIds,
      availableBonusWorkouts
    );
  }, [todaysCompletedBonusIds, availableBonusWorkouts]);

  const bonusXpRemainingToday = Math.max(
    0,
    BONUS_XP_CAP_PER_DAY - bonusXpEarnedToday
  );

  const dailyMainXpEarned = completedCount * getStepXp(todaysWorkout);

  useEffect(() => {
    const savedState = localStorage.getItem("fitness-today-state");
    const savedPlan = localStorage.getItem("fitness-today-plan");

    if (savedPlan) {
      setPlan(JSON.parse(savedPlan));
    }

    if (savedState) {
      const parsed = JSON.parse(savedState) as Partial<AppState> & {
        completedStepsByDate?: Record<string, string[]>;
      };

      setState({
        ...defaultState,
        ...parsed,
        completedExerciseIdsByDate:
          parsed.completedExerciseIdsByDate || parsed.completedStepsByDate || {},
        completedBonusIdsByDate: parsed.completedBonusIdsByDate || {},
        dailyWorkoutSnapshotByDate: parsed.dailyWorkoutSnapshotByDate || {},
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("fitness-today-state", JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem("fitness-today-plan", JSON.stringify(plan));
  }, [plan]);

  const xpIntoCurrentLevel = state.xp % XP_PER_LEVEL;
  const progressPercent = (xpIntoCurrentLevel / XP_PER_LEVEL) * 100;
  const xpNeeded = XP_PER_LEVEL - xpIntoCurrentLevel;

  const triggerRewardFeedback = (xpGain: number, customMessage?: string) => {
    setFloatingXp(xpGain);
    setMascotMood("happy");
    setMessage(customMessage || `Nice. You earned ${xpGain} XP.`);

    window.setTimeout(() => {
      setMascotMood("idle");
    }, 1100);

    window.setTimeout(() => {
      setFloatingXp(null);
    }, 1200);
  };

  const handleChangeSelectedDayType = (dayType: DayType) => {
    if (!selectedDay) return;

    setPlan((prev) => ({
      ...prev,
      [selectedDay]: dayType,
    }));

    setMessage(`${selectedDay} changed to ${dayType}.`);
  };

  const applyTemplate = (template: "normal" | "sport-heavy" | "recovery") => {
    if (template === "normal") {
      setPlan({
        Sunday: "Free",
        Monday: "WFH",
        Tuesday: "WFH",
        Wednesday: "Football",
        Thursday: "Office",
        Friday: "Office + Gym",
        Saturday: "Rest",
      });
      setMessage("Normal week template applied.");
      return;
    }

    if (template === "sport-heavy") {
      setPlan({
        Sunday: "Free",
        Monday: "WFH",
        Tuesday: "WFH",
        Wednesday: "Football",
        Thursday: "Tennis",
        Friday: "Office + Gym",
        Saturday: "Free",
      });
      setMessage("Sport heavy template applied.");
      return;
    }

    setPlan({
      Sunday: "Rest",
      Monday: "WFH",
      Tuesday: "Office",
      Wednesday: "Football",
      Thursday: "Office",
      Friday: "Office + Gym",
      Saturday: "Rest",
    });
    setMessage("Recovery week template applied.");
  };

  const handleCompleteExercise = (exerciseId: string) => {
    if (todaysWorkout === "Rest") {
      setMessage("Today is a rest day.");
      return;
    }

    if (allDone) {
      setMessage("Main workout already complete. Bonus training is below.");
      return;
    }

    if (todaysCompletedExerciseIds.includes(exerciseId)) {
      setMessage("That mission is already done.");
      return;
    }

    const xpGain = getStepXp(todaysWorkout);
    const yesterday = getYesterdayString();
    const isFirstExerciseToday = todaysCompletedExerciseIds.length === 0;
    const isFinishingDay =
      todaysCompletedExerciseIds.length + 1 === todaysExercises.length;

    const snapshotToLock: DailyWorkoutSnapshot = todaysSnapshot || {
      workout: liveWorkout,
      displayName: liveWorkoutDisplay,
      level: state.level,
      tier: getDifficultyTier(state.level),
      exercises: liveExercises,
    };

    setState((prev) => {
      const currentDone = prev.completedExerciseIdsByDate[todayDate] || [];
      const newCompletedForToday = [...currentDone, exerciseId];
      const newXp = prev.xp + xpGain;
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

      let newStreak = prev.streak;
      let newTotalSessions = prev.totalSessions;
      let newLastCompletedDate = prev.lastCompletedDate;

      if (isFirstExerciseToday) {
        if (prev.lastCompletedDate === yesterday) {
          newStreak = prev.streak + 1;
        } else if (prev.lastCompletedDate !== todayDate) {
          newStreak = 1;
        }

        newTotalSessions = prev.totalSessions + 1;
        newLastCompletedDate = todayDate;
      }

      const shouldRotate =
        isFinishingDay &&
        (snapshotToLock.workout === "Home Upper A" ||
          snapshotToLock.workout === "Home Upper B");

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        totalSessions: newTotalSessions,
        lastCompletedDate: newLastCompletedDate,
        upperRotation: shouldRotate
          ? snapshotToLock.workout === "Home Upper A"
            ? "B"
            : "A"
          : prev.upperRotation,
        completedExerciseIdsByDate: {
          ...prev.completedExerciseIdsByDate,
          [todayDate]: newCompletedForToday,
        },
        dailyWorkoutSnapshotByDate: {
          ...prev.dailyWorkoutSnapshotByDate,
          [todayDate]: snapshotToLock,
        },
      };
    });

    const newXpTotal = state.xp + xpGain;
    const newLevel = Math.floor(newXpTotal / XP_PER_LEVEL) + 1;
    const leveledUp = newLevel > state.level;
    const newTier = getDifficultyTier(newLevel);
    const tierWentUp = newTier > snapshotToLock.tier;

    if (isFinishingDay && leveledUp && tierWentUp) {
      triggerRewardFeedback(
        xpGain,
        `Daily workout complete. You reached level ${newLevel}. Tomorrow gets harder.`
      );
      return;
    }

    if (isFinishingDay && leveledUp) {
      triggerRewardFeedback(
        xpGain,
        `Daily workout complete. Level ${newLevel} reached. Come back tomorrow for your next main session.`
      );
      return;
    }

    if (isFinishingDay) {
      triggerRewardFeedback(
        xpGain,
        "Daily workout complete. Nice work. Bonus training is now available."
      );
      return;
    }

    if (leveledUp && tierWentUp) {
      triggerRewardFeedback(
        xpGain,
        `Level up. You reached level ${newLevel}. New difficulty unlocks tomorrow.`
      );
      return;
    }

    if (leveledUp) {
      triggerRewardFeedback(xpGain, `Level up. You reached level ${newLevel}.`);
      return;
    }

    triggerRewardFeedback(
      xpGain,
      `Mission done. ${
        todaysExercises.length - (todaysCompletedExerciseIds.length + 1)
      } to go.`
    );
  };

  const handleCompleteBonusWorkout = (bonus: BonusWorkout) => {
    if (!allDone) {
      setMessage("Finish today’s main workout first.");
      return;
    }

    if (todaysCompletedBonusIds.includes(bonus.id)) {
      setMessage("That bonus workout is already done.");
      return;
    }

    if (bonusXpRemainingToday <= 0) {
      setMessage("You hit today’s bonus XP cap. Main workout is still what counts most.");
      return;
    }

    const xpGain = Math.min(bonus.xp, bonusXpRemainingToday);

    if (xpGain <= 0) {
      setMessage("No bonus XP remaining today.");
      return;
    }

    setState((prev) => {
      const currentBonuses = prev.completedBonusIdsByDate[todayDate] || [];
      const newXp = prev.xp + xpGain;
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        completedBonusIdsByDate: {
          ...prev.completedBonusIdsByDate,
          [todayDate]: [...currentBonuses, bonus.id],
        },
      };
    });

    const newXpTotal = state.xp + xpGain;
    const newLevel = Math.floor(newXpTotal / XP_PER_LEVEL) + 1;
    const leveledUp = newLevel > state.level;

    if (leveledUp) {
      triggerRewardFeedback(
        xpGain,
        `Bonus training done. Level ${newLevel} reached.`
      );
      return;
    }

    triggerRewardFeedback(
      xpGain,
      `Bonus training complete. ${Math.max(
        0,
        bonusXpRemainingToday - xpGain
      )} bonus XP left today.`
    );
  };

  const handleReset = () => {
    localStorage.removeItem("fitness-today-state");
    localStorage.removeItem("fitness-today-plan");
    setState(defaultState);
    setPlan(defaultPlan);
    setSelectedDay(null);
    setMessage("Save reset.");
    setMascotMood("idle");
    setFloatingXp(null);
  };
    return (
    <div className="scene">
      <div className="cloud cloud-1" />
      <div className="cloud cloud-2" />
      <div className="cloud cloud-3" />
      <div className="cloud cloud-4" />
      <div className="sparkle sparkle-1" />
      <div className="sparkle sparkle-2" />
      <div className="sparkle sparkle-3" />

      <main className="app-frame desktop-clean-layout">
        <section className="top-hero hero-compact">
          <div className="mascot-header">
            <div className="mascot-zone">
              <Mascot mood={mascotMood} size={96} src={mascotSrc} />
              {floatingXp !== null && (
                <div className="floating-xp">+{floatingXp} XP</div>
              )}
            </div>

            <div className="mascot-speech">
              <h1>
                Today is {todayFriendlyDate}, and we’re focusing on{" "}
                {todaysWorkoutDisplay}.
              </h1>
              <p className="message">{message}</p>
            </div>

            <div className="level-badge">
              <span>Lvl</span>
              <strong>{state.level}</strong>
            </div>
          </div>
        </section>

        <section className="daily-grid">
          <div className="panel progress-panel">
            <div className="section-heading">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <SectionIcon src={mascotSrc} />
                <h3>Today’s Progress</h3>
              </div>
            </div>

            <div className="progress-panel-inner">
              <ProgressRing
                completed={completedCount}
                total={Math.max(totalCount, 1)}
              />

              <div className="daily-progress-copy">
                <div className="stats-row compact-stats">
                  <div className="stat-card">
                    <span>XP</span>
                    <strong>{state.xp}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Streak</span>
                    <strong>{state.streak}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Sessions</span>
                    <strong>{state.totalSessions}</strong>
                  </div>
                </div>

                <div className="xp-card">
                  <div className="xp-top">
                    <span>Progress to next level</span>
                    <span>
                      {xpIntoCurrentLevel} / {XP_PER_LEVEL}
                    </span>
                  </div>
                  <div className="xp-bar">
                    <div
                      className="xp-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="muted-text">{xpNeeded} XP to next level</p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 2,
                  }}
                >
                  <SectionIcon size={20} src={mascotSrc} />
                  <p className="muted-text">
                    Difficulty tier: {currentTier}
                    {todaysSnapshot
                      ? " · locked for today"
                      : " · will lock on first mission"}
                  </p>
                </div>

                {allDone && (
                  <div className="xp-card" style={{ marginTop: 12 }}>
                    <div className="xp-top">
                      <span>Main XP earned today</span>
                      <span>{dailyMainXpEarned} XP</span>
                    </div>
                    <div className="xp-top">
                      <span>Bonus XP earned today</span>
                      <span>
                        {bonusXpEarnedToday} / {BONUS_XP_CAP_PER_DAY}
                      </span>
                    </div>
                    <p className="muted-text">
                      Your main daily workout is complete. Bonus training gives
                      reduced XP and does not affect your streak.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="panel missions-panel">
            <div className="section-heading">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <SectionIcon src={mascotSrc} />
                <h3>{allDone ? "Daily Workout Complete" : "Today’s Missions"}</h3>
              </div>
              {allDone && <span className="done-pill">Done</span>}
            </div>

            {todaysWorkout === "Rest" ? (
              <div
                className="rest-state-card"
                style={{ display: "flex", alignItems: "center", gap: 14 }}
              >
                <Mascot size={56} src={mascotSrc} />
                <p className="message">
                  Full rest day. Recover properly and come back tomorrow.
                </p>
              </div>
            ) : allDone ? (
              <div className="task-stack">
                <div className="rest-state-card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 12,
                    }}
                  >
                    <Mascot mood="happy" size={60} src={mascotSrc} />
                    <div>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: 20,
                          lineHeight: 1.2,
                        }}
                      >
                        You finished today’s main session
                      </h4>
                      <p className="muted-text" style={{ marginTop: 6 }}>
                        {completedCount}/{totalCount} missions done · +
                        {dailyMainXpEarned} XP earned today
                      </p>
                    </div>
                  </div>

                  <p className="message" style={{ marginBottom: 8 }}>
                    Great work. Your streak has been updated and tomorrow’s main
                    session will appear fresh.
                  </p>

                  <p className="muted-text" style={{ margin: 0 }}>
                    You can still do optional bonus training below for reduced
                    XP.
                  </p>
                </div>

                <div className="section-heading" style={{ marginTop: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <SectionIcon src={mascotSrc} />
                    <h3>Bonus Training</h3>
                  </div>
                  <span className="type-pill type-free">
                    {bonusXpEarnedToday}/{BONUS_XP_CAP_PER_DAY} XP
                  </span>
                </div>

                <p className="muted-text" style={{ marginTop: -4 }}>
                  Extra movement for a little more XP. This does not replace
                  tomorrow’s workout.
                </p>

                {availableBonusWorkouts.map((bonus) => {
                  const done = todaysCompletedBonusIds.includes(bonus.id);
                  const wouldBeCapped = !done && bonusXpRemainingToday <= 0;

                  return (
                    <button
                      key={bonus.id}
                      className={`task-card ${done ? "task-card-done" : ""}`}
                      onClick={() => handleCompleteBonusWorkout(bonus)}
                      disabled={done || wouldBeCapped}
                    >
                      <div className="task-card-left">
                        <span
                          className={`task-check ${done ? "task-check-done" : ""}`}
                        >
                          {done ? "✓" : ""}
                        </span>
                        <span className="task-text">
                          <strong style={{ display: "block", marginBottom: 2 }}>
                            {bonus.title}
                          </strong>
                          <span className="muted-text">{bonus.description}</span>
                        </span>
                      </div>

                      <span className="task-xp">
                        +{Math.min(bonus.xp, bonusXpRemainingToday)} XP
                      </span>
                    </button>
                  );
                })}

                {bonusXpRemainingToday <= 0 && (
                  <div className="rest-state-card">
                    <p className="message" style={{ marginBottom: 6 }}>
                      Bonus XP cap reached for today.
                    </p>
                    <p className="muted-text" style={{ margin: 0 }}>
                      Nice. You can still rest now and come back tomorrow for
                      full-value missions.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="task-stack">
                {todaysExercises.map((exercise) => {
                  const done = todaysCompletedExerciseIds.includes(exercise.id);

                  return (
                    <button
                      key={exercise.id}
                      className={`task-card ${done ? "task-card-done" : ""}`}
                      onClick={() => handleCompleteExercise(exercise.id)}
                      disabled={done}
                    >
                      <div className="task-card-left">
                        <span
                          className={`task-check ${done ? "task-check-done" : ""}`}
                        >
                          {done ? "✓" : ""}
                        </span>
                        <span className="task-text">
                          {formatExerciseLabel(exercise)}
                        </span>
                      </div>

                      <span className="task-xp">
                        +{getStepXp(todaysWorkout)} XP
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="panel week-panel wide-week-panel">
          <div className="section-heading">
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <SectionIcon src={mascotSrc} />
                <h3>Weekly Planner</h3>
              </div>
              <p className="muted-text small-gap">Tap a day to edit it.</p>
            </div>
          </div>

          <div className="template-row">
            <button
              className="soft-button"
              onClick={() => applyTemplate("normal")}
            >
              Normal
            </button>
            <button
              className="soft-button"
              onClick={() => applyTemplate("sport-heavy")}
            >
              Sport Heavy
            </button>
            <button
              className="soft-button"
              onClick={() => applyTemplate("recovery")}
            >
              Recovery
            </button>
          </div>

          <div className="week-strip">
            {dayNames.map((day) => (
              <button
                key={day}
                className={`day-tile ${day === todayDay ? "today-tile" : ""} ${
                  selectedDay === day ? "selected-tile" : ""
                }`}
                onClick={() => setSelectedDay(day)}
              >
                <span className="day-short">{shortDayNames[day]}</span>
                <span className="day-full">{day}</span>
                <span className={getDayTypeColorClass(plan[day])}>
                  {plan[day]}
                </span>
              </button>
            ))}
          </div>

          {selectedDay && (
            <div className="editor-card">
              <div className="editor-top">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <SectionIcon size={20} src={mascotSrc} />
                  <h4>Edit {selectedDay}</h4>
                </div>
                <button
                  className="close-button"
                  onClick={() => setSelectedDay(null)}
                >
                  Close
                </button>
              </div>

              <div className="chip-grid">
                {dayTypeOptions.map((option) => (
                  <button
                    key={option}
                    className={`chip-button ${
                      plan[selectedDay] === option ? "active" : ""
                    }`}
                    onClick={() => handleChangeSelectedDayType(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="bottom-row">
          <button className="danger-button" onClick={handleReset}>
            Reset Save
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;