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
    this.initFeedback();
  }

  async initExercise() {
    const config = this.exerciseManager.getCurrentExercise();
    this.exerciseDetector = new config.detector(
      (data) => this.handleExerciseDetected(data),
      (feedback) => this.uiManager.updateFeedback(feedback),
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
      this.uiManager.updateFeedback({
        message: error.message,
        icon: "🛑",
        type: "error",
      });
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
    const logEntry = this.generateActivityLog(data);
    this.uiManager.updateActivityLog(logEntry);
  }

  async handleExerciseChange(exerciseType) {
    if (!this.exerciseManager.setExercise(exerciseType)) return;

    this.uiManager.updateUIForExercise();

    const activityTypeSelect = document.getElementById("activityType");
    if (activityTypeSelect) activityTypeSelect.value = exerciseType;

    await this.initExercise();

    this.uiManager.triggerExerciseChangeFeedback();
  }

  // Set initial feedback based on the detector's starting state
  initFeedback() {
    // Get the current exercise configuration and feedback
    const initialPhase = this.exerciseDetector.getCurrentState();
    const config = this.exerciseManager.getCurrentExercise();
    const initialFeedback = config.phases[initialPhase]?.feedback;

    console.log("Initial feedback:", initialFeedback);

    if (initialFeedback) {
      this.uiManager.updateFeedback(initialFeedback);
    } else {
      console.warn("Initial feedback not found for phase:", initialPhase);
      this.uiManager.updateFeedback({
        message: "...",
        icon: "⏳",
        type: "interim",
      });
    }
  }

  handlePoseResults(results) {
    const landmarks = results.landmarks[0];
    this.drawingUtils.drawLandmarks(landmarks);

    const metrics = PoseCalculations.calculateMetrics(landmarks);
    this.exerciseDetector.processPose(landmarks, metrics);
    this.uiManager.updateMetrics(metrics);
  }

  // Function to generate a random log sentence
  generateActivityLog(logData) {
    const logTemplates = {
      total: [
        "+1 {emoji} {count} and counting, another!",
        "+1 {emoji} {count} reps deep, you’re a machine!",
        "+1 {emoji} {count} strong, let’s see another!",
        "+1 {emoji} {count} down, keep going!",
        "+1 {emoji} {count} and climbing, unstoppable!",
      ],
      timestamp: [
        "+1 {emoji} nailed at {time}, lets gooo",
        "+1 {emoji} smashed at {time}",
        "+1 {emoji} another at {time}",
        "+1 {emoji} hit at {time}, too strong!",
        "+1 {emoji} at {time}",
      ],
      sound: [
        "+1 {emoji} yeaahhhh buddy!",
        "+1 {emoji} WHOS GONNA CARRY THE BOATS!?",
        "+1 {emoji} they dont know you son !!!",
        "+1 {emoji} lightweight babbyyy",
      ],
      keyAngles: [
        "+1 {emoji} deep! Your {angle_name} hit {angle_size}°!",
        "+1 {emoji} nice form, {angle_size}° {angle_name} bend",
        "+1 {emoji} {angle_size}° {angle_name}, keep that depth",
        "+1 {emoji} {angle_size}° {angle_name} drop, solid technique",
      ],
      // TODO add sound functionality? duration?
    };

    // Console log the raw JSON data
    console.log("Raw JSON Data:", JSON.stringify(logData, null, 2));

    // Step 1: Choose a random log type
    const logTypes = Object.keys(logTemplates);
    const randomType = logTypes[Math.floor(Math.random() * logTypes.length)];

    // Step 2: Choose a random sentence from that type
    const sentences = logTemplates[randomType];
    const randomSentence =
      sentences[Math.floor(Math.random() * sentences.length)];

    // Step 3: Populate the sentence with JSON data
    let result = randomSentence
      .replace("{emoji}", logData.emoji)
      .replace("{count}", logData.totalCount)
      .replace("{time}", logData.timestamp);
    // TODO could very easily add dufrations - that one took o.3 seconds
    // .replace("{down_phase}", logData.durations.down.toFixed(1))
    //     .replace("{up_phase}", logData.durations.up.toFixed(1));

    if (randomType === "keyAngles") {
      const angles = Object.keys(logData.keyAngles);
      const randomAngleKey = angles[Math.floor(Math.random() * angles.length)];
      const angleValue = logData.keyAngles[randomAngleKey];
      result = result
        .replace(/{angle_size}/g, angleValue)
        .replace(/{angle_name}/g, randomAngleKey);
    }

    // Step 4: Return the populated string
    return result;
  }
}

new ExerciseApp();
