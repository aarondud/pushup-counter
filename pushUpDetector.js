// Module implements push-up detection logic.

import { ExerciseDetector } from "./exerciseDetector.js";

export class PushUpDetector extends ExerciseDetector {
  constructor(onExerciseDetected, onFeedback) {
    super(onExerciseDetected);
    this.onFeedback = onFeedback; // Callback for feedback messages
    this.status = "up";
  }

  processPose(landmarks, metrics) {
    if (!landmarks) {
      this.onFeedback("Please adjust the camera to show your body.", "error");
      return null;
    }

    if (!metrics.upperBodyInView) {
      this.onFeedback(
        "Please adjust the camera to show your upper body for push-up counting.",
        "error"
      );
      return null;
    }

    this.onFeedback("✅", "success");

    const { avgElbowAngle, avgWristDepth, backStraightness, shoulderHipAngle } =
      metrics;

    if (avgElbowAngle < 110 && avgWristDepth > 0.1 && this.status === "up") {
      this.status = "down";
      console.log("Push-up down phase detected", {
        avgElbowAngle,
        avgWristDepth,
      });
    } else if (avgElbowAngle > 140 && this.status === "down") {
      this.status = "up";
      this.stats.valid++;
      this.stats.total++;
      console.log("Push-up counted:", this.stats.valid);
      this.onFeedback("Push-Up Counted!", "success");

      // Trigger background pulse animation and sound
      this.onExerciseDetected();

      return {
        count: this.stats.valid,
        avgWristDepth: avgWristDepth.toFixed(2),
        backStraightness: backStraightness
          ? Math.round(backStraightness)
          : "N/A",
        shoulderHipAngle: shoulderHipAngle
          ? Math.round(shoulderHipAngle)
          : "N/A",
      };
    } else if (avgElbowAngle > 110 && this.status === "down") {
      this.onFeedback("Elbows Not Bent Enough", "error");
    } else if (avgWristDepth < 0.1 && this.status === "down") {
      this.onFeedback("Too High", "error");
    }

    return null;
  }
}
