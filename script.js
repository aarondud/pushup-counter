import { PoseProcessor } from "./poseProcessor.js";
import { PoseCalculations } from "./poseCalculations.js";
import { CanvasDrawingUtils } from "./drawingUtils.js";
import { UIManager } from "./uiManager.js";
import { ExerciseManager } from "./exerciseManager.js";

class ExerciseApp {
  constructor() {
    this.videoCanvas = document.getElementById("videoCanvas");
    console.log("ExerciseApp: Canvas element found:", this.videoCanvas);

    this.exerciseManager = new ExerciseManager();
    this.uiManager = new UIManager(this.exerciseManager);
    this.drawingUtils = new CanvasDrawingUtils(this.videoCanvas);
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
    console.log("initPoseProcessor: Waiting for UI to set canvas dimensions");
    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay to ensure UI is ready
    console.log("initPoseProcessor: Canvas dimensions after delay:", {
      width: this.videoCanvas.width,
      height: this.videoCanvas.height,
    });

    this.poseProcessor = new PoseProcessor(
      this.videoCanvas,
      (results) => this.handlePoseResults(results),
      (dimensions) => {
        // Callback to pass video dimensions to UIManager
        console.log("ExerciseApp: Received video dimensions:", dimensions);
        this.uiManager.setAspectRatio(dimensions.aspectRatio);
      }
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

    this.uiManager.updateUIForExercise();

    const activityTypeSelect = document.getElementById("activityType");
    if (activityTypeSelect) activityTypeSelect.value = exerciseType;

    await this.initExercise();

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
