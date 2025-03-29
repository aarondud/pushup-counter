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
      (exerciseData) => {
        this.uiManager.triggerPulseAnimation();
        this.uiManager.updateStatsTable(exerciseData);
      },
      (message, type) => this.uiManager.updateFeedback(message, type),
      (motion) => this.uiManager.updateMotionIndicator(motion)
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
    this.drawingUtils.drawLandmarks(landmarks, "pushUp");

    const metrics = PoseCalculations.calculateMetrics(landmarks);
    this.exerciseDetector.processPose(landmarks, metrics);
    this.uiManager.updateDataPoints(metrics);
  }
}

new PushUpApp();
