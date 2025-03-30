import { PushUpDetector } from "./exerciseDetectors/pushUpDetector.js";
import { SquatDetector } from "./exerciseDetectors/squatDetector.js";
import { PunchDetector } from "./exerciseDetectors/punchDetector.js";

export class ExerciseManager {
  constructor() {
    this.exercises = {
      pushUp: {
        name: "Push-Ups",
        color: "#2196f3", // blue
        icon: "💪",
        defaultSound: "sounds/YEAHBUDDY.mp3",
        detector: PushUpDetector,
        counts: 0,
        requiredLandmarks: [11, 12, 13, 14, 15, 16, 23, 24],
        hysteresis: 5,
        minFrames: 5,
        phases: {
          NOT_VISIBLE: {
            feedback: {
              message:
                "Adjust 📸 camera, 🧍‍♂️ body positioning or 💡 lighting so shoulders, arms, and hips are in view",
              type: "error",
            },
          },
          NOT_READY: {
            feedback: {
              message: "🏋️‍♀️ Assume push-up position",
              type: "assume",
            },
          },
          READY: {
            feedback: {
              message: "💪 Ready to push",
              type: "success",
            },
          },
          DOWN: {
            feedback: {
              message: "⬇️ Down phase detected",
              type: "phase",
            },
          },
          PARTIAL: {
            feedback: {
              message: " **red** Partial rep",
              type: "assume",
            },
          },
        },
        UP: {
          feedback: {
            message: "⬆️ Up phase detected",
            type: "phase",
          },
        },
        conditions: {
          elbowAngleTop: { enter: 155, exit: 160 },
          elbowAngleBottom: { enter: 95, exit: 100 },
          wristDepth: { max: 0.13 },
          backAngle: { min: 150, max: 210 },
          wristDepthMax: 0.13,
          backAngleRange: { min: 150, max: 210 },
          heightDiffMax: 0.05,
        },
      },
      squat: {
        name: "Squats",
        color: "#795548", // brown
        icon: "💪",
        defaultSound: "sounds/YEAHBUDDY.mp3",
        detector: SquatDetector,
        counts: 0,
        requiredLandmarks: [11, 12, 13, 14, 15, 16, 23, 24], // TODO adjust
        thresholds: {},
      },
      punch: {
        name: "Punches",
        color: "#9c27b0", // purple
        icon: "👊",
        defaultSound: "sounds/YEAHBUDDY.mp3",
        detector: PunchDetector,
        counts: 0,
        requiredLandmarks: [11, 12, 13, 14, 15, 16, 23, 24], // TODO adjust
        thresholds: {},
      },
    };
    this.currentExercise = "pushUp";
    this.previousCounts = {}; // For session persistence
    this.isMuted = false;
  }

  // Set current exercise
  setExercise(exerciseType) {
    if (this.exercises[exerciseType]) {
      this.currentExercise = exerciseType;

      // Update styling
      document.documentElement.style.setProperty(
        "--exercise-primary",
        this.exercises[exerciseType].color
      );
      localStorage.setItem("currentExercise", exerciseType);
      return true;
    }
    return false;
  }

  // Get current exercise
  getCurrentExercise() {
    return {
      ...this.exercises[this.currentExercise],
      type: this.currentExercise,
    };
  }

  setCurrentSound(soundPath) {
    this.exercises[this.currentExercise].currentSound = soundPath;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  //   saveCountsToStorage() {
  //     localStorage.setItem("exerciseCounts", JSON.stringify(this.exercises));
  //   }

  //   loadCountsFromStorage() {
  //     const saved = localStorage.getItem("exerciseCounts");
  //     if (saved) {
  //       const counts = JSON.parse(saved);
  //       Object.keys(counts).forEach((ex) => {
  //         if (this.exercises[ex]) {
  //           this.exercises[ex].counts = counts[ex].counts || 0;
  //         }
  //       });
  //     }
  //   }
}
