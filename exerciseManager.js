import { PushUpDetector } from "./exerciseDetectors/pushUpDetector.js";
import { SquatDetector } from "./exerciseDetectors/squatDetector.js";
import { PunchDetector } from "./exerciseDetectors/punchDetector.js";

export class ExerciseManager {
  constructor() {
    this.exercises = {
      pushUp: {
        name: "Push-Ups",
        detector: PushUpDetector,
        icon: "💪",
        color: "#2196f3", // blue
        sounds: [
          "media/carryboats.mp3",
          "media/imback.mp3",
          "media/stayhard.mp3",
          "media/theydont.mp3",
        ],
        counts: 0,
        requiredLandmarks: [11, 12, 13, 14, 15, 16, 23, 24],
        keyMetrics: ["elbow"],
        hysteresis: 5,
        minFrames: 5,
        phases: {
          NOT_VISIBLE: {
            feedback: {
              message:
                "Adjust camera, body positioning or lighting so shoulders, arms, and hips are in view",
              icon: "📸",
              type: "error",
            },
          },
          NOT_READY: {
            feedback: {
              message: "Assume push-up position",
              icon: "🏋️‍♀️",
              type: "interim",
            },
          },
          READY: {
            feedback: {
              message: "Ready to push",
              icon: "✅",
              type: "success",
            },
          },
          DOWN: {
            feedback: {
              message: "Down phase detected",
              icon: "⬇️",
              type: "success",
            },
          },
          PARTIAL: {
            feedback: {
              message: "Partial rep",
              icon: "⚠️",
              type: "interim",
            },
          },
          UP: {
            feedback: {
              message: "Up phase detected",
              icon: "⬆️",
              type: "success",
            },
          },
        },
        conditions: {
          elbowAngleTop: { enter: 155, exit: 160 },
          elbowAngleBottom: { enter: 95, exit: 100 },
          wristDepth: { max: 0.13 },
          hipAngle: { min: 150, max: 210 },
          wristDepthMax: 0.13,
          heightDiffMax: 0.05,
        },
      },
      squat: {
        name: "Squats",
        detector: SquatDetector,
        icon: "🏋️‍♂️",
        color: "#795548", // brown
        sounds: [
          "media/yeahbuddy.mp3",
          "media/lightweight.mp3",
          "media/gottaget.mp3",
          "media/wooo.mp3",
          "media/yeap.mp3",
        ],
        counts: 0,
        requiredLandmarks: [11, 12, 13, 14, 15, 16, 23, 24], // TODO adjust
        keyMetrics: ["hip", "knee"],
        thresholds: {},
      },
      punch: {
        name: "Punches",
        detector: PunchDetector,
        icon: "🥊",
        color: "#9c27b0", // purple
        sounds: ["media/punch1.mp3"],
        counts: 0,
        requiredLandmarks: [11, 12, 13, 14, 15, 16, 23, 24], // TODO adjust
        keyMetrics: ["elbow"],
        thresholds: {},
      },
    };
    this.currentExercise = "pushUp";
    this.previousCounts = {}; // For session persistence
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
}
