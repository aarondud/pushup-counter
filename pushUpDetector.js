// Module implements push-up detection logic.

import { ExerciseDetector } from "./exerciseDetector.js";
import { isLandmarkInView } from "./poseUtils.js";

export class PushUpDetector extends ExerciseDetector {
  constructor(onExerciseDetected, onFeedback, onMotionUpdate) {
    super(onExerciseDetected);
    this.onFeedback = onFeedback;
    this.onMotionUpdate = onMotionUpdate;
    this.state = "IDLE"; // States: IDLE, DOWN, UP
    this.pushUpCount = 0;
    this.lastFeedbackMessage = null;
    this.downStartTime = null;
    this.upStartTime = null;
    this.downDuration = 0;
    this.upDuration = 0;
    this.frameCounters = { idle: 0, down: 0, up: 0 };
    this.prevElbowAngle = null;
  }

  updateFeedback(message, type) {
    if (message !== this.lastFeedbackMessage) {
      this.lastFeedbackMessage = message;
      this.onFeedback(message, type);
      this.onMotionUpdate("");
    }
  }

  processPose(landmarks, metrics) {
    const requiredLandmarks = [
      landmarks[11],
      landmarks[12],
      landmarks[13],
      landmarks[14],
      landmarks[15],
      landmarks[16],
      landmarks[23],
      landmarks[24],
    ];

    const allVisible = requiredLandmarks.every(isLandmarkInView);
    if (!allVisible) {
      this.updateFeedback(
        "Adjust 📸 camera, 🧍‍♂️ body positioning or 💡 lighting so shoulders, arms, and hips are in view",
        "error"
      );
      this.state = "IDLE";
      this.frameCounters = { idle: 0, down: 0, up: 0 };
      return null;
    }

    if (this.lastFeedbackMessage?.includes("Adjust 📸")) {
      this.lastFeedbackMessage = null;
    }

    const { avgElbowAngle, avgWristDepth, avgHipAngle, avgHeightDepth } =
      metrics;

    // Push-up detection constants
    const IDLE_ELB_ANGLE = 160;
    const BOTTOM_ELB_ANGLE = 100;
    const WRIST_DEPTH = 0.13;
    const BACK_STRAIGHT_MIN = 150;
    const BACK_STRAIGHT_MAX = 210;
    const HEIGHT_DIFF_MAX = 0.05;
    const DEBOUNCING_FRAME_RATE = 5;

    console.log("Metrics:", {
      avgElbowAngle,
      avgWristDepth,
      avgHipAngle,
      avgHeightDepth,
    });

    switch (this.state) {
      case "IDLE":
        if (
          avgElbowAngle > IDLE_ELB_ANGLE &&
          avgWristDepth < WRIST_DEPTH &&
          avgHipAngle >= BACK_STRAIGHT_MIN &&
          avgHipAngle <= BACK_STRAIGHT_MAX &&
          avgHeightDepth < HEIGHT_DIFF_MAX
        ) {
          this.frameCounters.idle++;
          if (this.frameCounters.idle >= DEBOUNCING_FRAME_RATE) {
            this.updateFeedback("💪 Ready to push", "success");
          }
        } else if (
          avgElbowAngle < IDLE_ELB_ANGLE
          // && avgWristDepth < WRIST_DEPTH
          // && avgHeightDepth < BACK_HEIGHT_DIFF_MAX // [!] Added to ensure push-up context
          // avgHipAngle >= BACK_STRAIGHT_MIN &&
          // avgHipAngle <= BACK_STRAIGHT_MAX
        ) {
          this.frameCounters.down++;
          if (this.frameCounters.down >= DEBOUNCING_FRAME_RATE) {
            this.state = "DOWN";
            this.downStartTime = Date.now();

            this.updateFeedback("⬇️ Down phase detected", "phase");
            console.log("Push-up down phase detected", {
              avgElbowAngle,
              avgWristDepth,
              avgHeightDepth,
              downDuration: this.downDuration,
              downStartTime: this.downStartTime,
            });
          }
        } else {
          this.frameCounters.idle = 0;
          this.frameCounters.down = 0;
          this.updateFeedback("🏋️‍♀️ Assume push-up position", "assume");
          this.downStartTime = null;
          this.upStartTime = null;
        }
        break;

      case "DOWN":
        if (avgElbowAngle > BOTTOM_ELB_ANGLE) {
          this.frameCounters.up++;
          if (this.frameCounters.up >= DEBOUNCING_FRAME_RATE) {
            this.state = "UP";
            this.downDuration = (
              (Date.now() - this.downStartTime) /
              1000
            ).toFixed(2);
            this.upStartTime = Date.now();
            console.log("Push-up up phase detected", {
              avgElbowAngle,
              avgWristDepth,
              avgHeightDepth,
              upDuration: this.upDuration,
              upStartTime: this.upStartTime,
            });
            this.updateFeedback("⬆️ Up phase detected", "phase");
          }
        } else {
          this.frameCounters.up = 0;
          this.updateFeedback("⬇️ Down phase detected", "phase");
        }
        break;

      case "UP":
        if (
          avgElbowAngle > IDLE_ELB_ANGLE
          //&& avgWristDepth < WRIST_DEPTH &&
          // avgHipAngle >= BACK_STRAIGHT_MIN &&
          // avgHipAngle <= BACK_STRAIGHT_MAX &&
          // avgHeightDepth < HEIGHT_DIFF_MAX
        ) {
          this.frameCounters.idle++;
          if (this.frameCounters.idle >= DEBOUNCING_FRAME_RATE) {
            this.state = "IDLE";
            this.upDuration = ((Date.now() - this.upStartTime) / 1000).toFixed(
              2
            );
            this.pushUpCount++;
            this.stats.valid++;
            this.stats.total++;
            this.updateFeedback("💪 Ready to push", "success");
            console.log("Push-up counted:", this.stats.valid);
            // this.onExerciseDetected();
            console.log(
              "upDuration",
              this.upDuration,
              "downDuration",
              this.downDuration
            );

            this.onExerciseDetected({
              count: this.pushUpCount,
              downDuration: this.downDuration,
              upDuration: this.upDuration,
            });

            this.downStartTime = null;
            this.upStartTime = null;
            return {
              count: this.stats.valid,
              avgWristDepth: avgWristDepth.toFixed(2),
            };
          }
        } else {
          this.frameCounters.idle = 0;
          this.updateFeedback("⬆️ Up phase detected", "phase");
        }
        break;
    }

    this.prevElbowAngle = avgElbowAngle;
    return null;
  }
}
