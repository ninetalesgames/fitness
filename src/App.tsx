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

type AppState = {
  xp: number;
  level: number;
  streak: number;
  totalSessions: number;
  lastCompletedDate: string | null;
  upperRotation: "A" | "B";
  completedStepsByDate: Record<string, string[]>;
};

const XP_PER_LEVEL = 100;

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
  completedStepsByDate: {},
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

const getWorkoutDetails = (workout: WorkoutType): string[] => {
  switch (workout) {
    case "Home Upper A":
      return [
        "12 push ups",
        "10 incline push ups",
        "8 pike push ups",
        "12 chair dips",
        "15 sit ups",
        "30 second plank",
      ];
    case "Home Upper B":
      return [
        "10 close grip push ups",
        "8 slow push ups",
        "10 chair dips",
        "12 leg raises",
        "20 shoulder taps each side",
        "35 second plank",
      ];
    case "Office Pull Gym":
      return [
        "Lat pulldown 3 x 10",
        "Seated row 3 x 10",
        "Dumbbell row 3 x 10 each side",
        "Bicep curls 3 x 12",
        "Rear delt fly 3 x 12",
      ];
    case "Football":
      return [
        "Play football",
        "Count this as your full session",
        "Focus on intensity and movement",
      ];
    case "Tennis":
      return [
        "Play tennis",
        "Count this as your full session",
        "Focus on movement and consistency",
      ];
    case "Free Day Core":
      return [
        "20 sit ups",
        "12 leg raises",
        "30 second plank",
        "20 second side plank each side",
        "5 minutes mobility",
      ];
    case "Recovery":
      return [
        "10 minute walk",
        "5 minute stretch",
        "Light mobility only",
      ];
    case "Rest":
      return ["Full rest day", "Recover properly", "No mission today"];
    default:
      return [];
  }
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
  mood: "idle" | "happy";
};

function Mascot({ mood }: MascotProps) {
  return (
    <div
      className={`mascot-wrap ${mood === "happy" ? "mascot-happy" : ""}`}
      aria-hidden="true"
    >
      <svg
        className="mascot-svg"
        viewBox="0 0 180 180"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="92" cy="160" rx="42" ry="10" className="mascot-shadow" />

        <g className="mascot-body-group">
          <circle cx="90" cy="86" r="42" className="mascot-body" />
          <ellipse cx="90" cy="98" rx="28" ry="22" className="mascot-belly" />

          <g className="mascot-arm mascot-arm-left">
            <ellipse cx="49" cy="87" rx="13" ry="24" className="mascot-limb" />
          </g>

          <g className="mascot-arm mascot-arm-right">
            <ellipse cx="131" cy="87" rx="13" ry="24" className="mascot-limb" />
          </g>

          <g className="mascot-leg mascot-leg-left">
            <ellipse cx="72" cy="138" rx="12" ry="22" className="mascot-limb" />
          </g>

          <g className="mascot-leg mascot-leg-right">
            <ellipse cx="108" cy="138" rx="12" ry="22" className="mascot-limb" />
          </g>

          <circle cx="75" cy="78" r="5.5" className="mascot-eye" />
          <circle cx="105" cy="78" r="5.5" className="mascot-eye" />
          <circle cx="77" cy="76" r="1.6" className="mascot-eye-shine" />
          <circle cx="107" cy="76" r="1.6" className="mascot-eye-shine" />

          <path
            d={
              mood === "happy"
                ? "M 76 94 Q 90 110 104 94"
                : "M 79 96 Q 90 105 101 96"
            }
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className="mascot-mouth"
          />

          <ellipse cx="90" cy="60" rx="20" ry="9" className="mascot-headband" />
          <path
            d="M 109 58 C 120 54, 128 60, 132 70"
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            className="mascot-headband-tail"
          />
        </g>
      </svg>
    </div>
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

  const todaysWorkout = useMemo(() => {
    return getWorkoutForDayType(todayDayType, state.upperRotation);
  }, [todayDayType, state.upperRotation]);

  const todaysWorkoutDisplay = useMemo(() => {
    return getWorkoutDisplayName(todaysWorkout);
  }, [todaysWorkout]);

  const todaysSteps = useMemo(() => {
    return getWorkoutDetails(todaysWorkout);
  }, [todaysWorkout]);

  const todaysCompletedSteps = state.completedStepsByDate[todayDate] || [];
  const completedCount = todaysCompletedSteps.length;
  const totalCount = todaysWorkout === "Rest" ? 0 : todaysSteps.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  useEffect(() => {
    const savedState = localStorage.getItem("fitness-today-state");
    const savedPlan = localStorage.getItem("fitness-today-plan");

    if (savedPlan) {
      setPlan(JSON.parse(savedPlan));
    }

    if (savedState) {
      const parsed = JSON.parse(savedState) as Partial<AppState>;

      setState({
        ...defaultState,
        ...parsed,
        completedStepsByDate: parsed.completedStepsByDate || {},
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

  const handleCompleteStep = (step: string) => {
    if (todaysWorkout === "Rest") {
      setMessage("Today is a rest day.");
      return;
    }

    if (todaysCompletedSteps.includes(step)) {
      setMessage("That step is already done.");
      return;
    }

    const xpGain = getStepXp(todaysWorkout);
    const yesterday = getYesterdayString();
    const isFirstStepToday = todaysCompletedSteps.length === 0;
    const isFinishingDay = todaysCompletedSteps.length + 1 === todaysSteps.length;

    setState((prev) => {
      const currentDone = prev.completedStepsByDate[todayDate] || [];
      const newCompletedForToday = [...currentDone, step];
      const newXp = prev.xp + xpGain;
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

      let newStreak = prev.streak;
      let newTotalSessions = prev.totalSessions;
      let newLastCompletedDate = prev.lastCompletedDate;

      if (isFirstStepToday) {
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
        (todaysWorkout === "Home Upper A" || todaysWorkout === "Home Upper B");

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        totalSessions: newTotalSessions,
        lastCompletedDate: newLastCompletedDate,
        upperRotation: shouldRotate
          ? todaysWorkout === "Home Upper A"
            ? "B"
            : "A"
          : prev.upperRotation,
        completedStepsByDate: {
          ...prev.completedStepsByDate,
          [todayDate]: newCompletedForToday,
        },
      };
    });

    const newXpTotal = state.xp + xpGain;
    const newLevel = Math.floor(newXpTotal / XP_PER_LEVEL) + 1;
    const leveledUp = newLevel > state.level;

    if (isFinishingDay && leveledUp) {
      triggerRewardFeedback(
        xpGain,
        `Level up. You reached level ${newLevel} and finished today’s session.`
      );
      return;
    }

    if (isFinishingDay) {
      triggerRewardFeedback(
        xpGain,
        "Session complete. Nice work. Come back tomorrow."
      );
      return;
    }

    if (leveledUp) {
      triggerRewardFeedback(xpGain, `Level up. You reached level ${newLevel}.`);
      return;
    }

    triggerRewardFeedback(
      xpGain,
      `Step done. ${todaysSteps.length - (todaysCompletedSteps.length + 1)} to go.`
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
              <Mascot mood={mascotMood} />
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
              <h3>Today’s Progress</h3>
            </div>

            <div className="progress-panel-inner">
              <ProgressRing completed={completedCount} total={Math.max(totalCount, 1)} />

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
              </div>
            </div>
          </div>

          <div className="panel missions-panel">
            <div className="section-heading">
              <h3>Today’s Missions</h3>
              {allDone && <span className="done-pill">Done</span>}
            </div>

            {todaysWorkout === "Rest" ? (
              <div className="rest-state-card">
                <p className="message">
                  Full rest day. Recover properly and come back tomorrow.
                </p>
              </div>
            ) : (
              <div className="task-stack">
                {todaysSteps.map((step) => {
                  const done = todaysCompletedSteps.includes(step);

                  return (
                    <button
                      key={step}
                      className={`task-card ${done ? "task-card-done" : ""}`}
                      onClick={() => handleCompleteStep(step)}
                      disabled={done}
                    >
                      <div className="task-card-left">
                        <span className={`task-check ${done ? "task-check-done" : ""}`}>
                          {done ? "✓" : ""}
                        </span>
                        <span className="task-text">{step}</span>
                      </div>

                      <span className="task-xp">+{getStepXp(todaysWorkout)} XP</span>
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
              <h3>Weekly Planner</h3>
              <p className="muted-text small-gap">Tap a day to edit it.</p>
            </div>
          </div>

          <div className="template-row">
            <button className="soft-button" onClick={() => applyTemplate("normal")}>
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
                <span className={getDayTypeColorClass(plan[day])}>{plan[day]}</span>
              </button>
            ))}
          </div>

          {selectedDay && (
            <div className="editor-card">
              <div className="editor-top">
                <h4>Edit {selectedDay}</h4>
                <button className="close-button" onClick={() => setSelectedDay(null)}>
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