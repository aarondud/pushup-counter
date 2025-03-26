import { PoseProcessor } from "./poseProcessor.js";
import { PoseCalculations } from "./poseCalculations.js";
import { CanvasDrawingUtils } from "./drawingUtils.js";
import { PushUpDetector } from "./pushUpDetector.js";
import { UIManager } from "./uiManager.js";

class PushUpApp {
  constructor() {
    this.videoCanvas = document.getElementById("videoCanvas");
    this.uiManager = new UIManager();
    this.drawingUtils = new CanvasDrawingUtils(this.videoCanvas);
    this.exerciseDetector = new PushUpDetector(
      () => this.uiManager.triggerPulseAnimation(),
      (message, type) => this.uiManager.updateFeedback(message, type)
    );
    this.poseProcessor = new PoseProcessor(this.videoCanvas, (results) =>
      this.handlePoseResults(results)
    );

    this.init();
  }

  async init() {
    try {
      await this.poseProcessor.initialize();
    } catch (error) {
      this.uiManager.updateFeedback(error.message, "error");
    }

    // Set up event listeners for pause/play
    document.getElementById("pause").addEventListener("click", () => {
      this.poseProcessor.pause();
    });

    document.getElementById("play").addEventListener("click", () => {
      this.poseProcessor.play();
    });

    document.getElementById("reset").addEventListener("click", () => {
      this.exerciseDetector.reset();
    });
  }

  handlePoseResults(results) {
    const landmarks = results.landmarks[0];
    this.drawingUtils.drawLandmarks(landmarks);

    const metrics = PoseCalculations.calculateMetrics(landmarks);
    const exerciseData = this.exerciseDetector.processPose(landmarks, metrics);

    this.uiManager.updateDataPoints({
      leftElbowAngle: Math.round(metrics.leftElbowAngle),
      rightElbowAngle: Math.round(metrics.rightElbowAngle),
      leftWristDepth: metrics.leftWristDepth.toFixed(2),
      rightWristDepth: metrics.rightWristDepth.toFixed(2),
      shoulderHipAngle: metrics.shoulderHipAngle
        ? Math.round(metrics.shoulderHipAngle)
        : "N/A",
      backStraightness: metrics.backStraightness
        ? Math.round(metrics.backStraightness)
        : "N/A",
    });

    if (exerciseData) {
      this.uiManager.updateCounter(exerciseData.count);
      this.uiManager.updateStatsTable(exerciseData);
    }
  }
}

new PushUpApp();
