import { PoseProcessor } from "./poseProcessor.js";
import { PoseCalculations } from "./poseCalculations.js";
import { CanvasDrawingUtils } from "./drawingUtils.js";
import { PushUpDetector } from "./exerciseDetectors/pushUpDetector.js";
import { UIManager } from "./uiManager.js";
import { ExerciseManager } from "./exerciseManager.js";

class ExerciseApp {
  constructor() {
    this.videoCanvas = document.getElementById("videoCanvas");
    this.drawingUtils = new CanvasDrawingUtils(this.videoCanvas);
    this.exerciseManager = new ExerciseManager();
    this.uiManager = new UIManager(this.exerciseManager);
    this.uiManager.setDrawingUtils(this.drawingUtils);

    this.initExercise();
    this.initPoseProcessor();
    this.setUpEventListeners();
  }

  async initExercise() {
    const config = this.exerciseManager.getCurrentExercise();
    this.exerciseDetector = new config.detector(
      (data) => this.handleExerciseDetected(data),
      (msg, type) => this.uiManager.updateFeedback(msg, type),
      config
    );
  }

  async initPoseProcessor() {
    this.poseProcessor = new PoseProcessor(this.videoCanvas, (results) =>
      this.handlePoseResults(results)
    );
    try {
      await this.poseProcessor.initialize();
    } catch (error) {
      this.uiManager.updateFeedback(error.message, "error");
    }
  }

  async setUpEventListeners() {
    document.getElementById("pause").addEventListener("click", () => {
      this.poseProcessor.pause();
    });

    document.getElementById("play").addEventListener("click", () => {
      this.poseProcessor.play();
    });

    document.getElementById("reset").addEventListener("click", () => {
      this.exerciseDetector.reset();
    });

    // TODO: needed?
    document.addEventListener("exerciseChange", (e) =>
      this.handleExerciseChange(e.detail.exerciseType)
    );
  }

  handleExerciseDetected(data) {
    this.uiManager.triggerCelebration();
    this.uiManager.updateActivityLog({
      ...data,
      activity: this.exerciseManager.getCurrentExercise().name,
    });
  }

  async handleExerciseChange(exerciseType) {
    if (!this.exerciseManager.setExercise(exerciseType)) return;

    // Update UI immediately (synchronously)
    this.uiManager.updateUIForExercise();

    // Update side menu selector
    const activityTypeSelect = document.getElementById("activityType");
    if (activityTypeSelect) activityTypeSelect.value = exerciseType;

    // Then handle async operations
    await this.initExercise();

    // Visual feedback (deliberately after async operations)
    this.uiManager.triggerExerciseChangeFeedback();
  }

  handlePoseResults(results) {
    const landmarks = results.landmarks[0];
    this.drawingUtils.drawLandmarks(landmarks);

    const metrics = PoseCalculations.calculateMetrics(landmarks);
    this.exerciseDetector.processPose(landmarks, metrics);
    this.uiManager.renderMetrics(metrics);
  }
}

new ExerciseApp();
