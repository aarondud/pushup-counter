// Module defines a base class for exercise detection, which can be extended for different exercises.

import { isLandmarkInView } from "../poseUtils.js";

export class ExerciseDetector {
  constructor(onExerciseDetected, onFeedback, config) {
    this.onExerciseDetected = onExerciseDetected; // Callback for when an exercise is detected
    this.onFeedback = onFeedback;
    this.config = config;

    // Initialise velocity tracking
    this.prevAngle = null;
    this.angleVelocity = 0;
    this.velocityBuffer = [];
    this.DELTA_DEG_PER_FRAME = null;
    this.VEL_BUFFER_SIZE = null;

    // Initialise state and statistics
    this.state = "NOT_VISIBLE";
    this.stats = { total: 0, valid: 0, invalid: 0 };

    // Initialize frame counters and timers for all phases
    this.frameCounters = {};
    this.phaseTimers = {};
    Object.keys(config.phases).forEach((phase) => {
      this.frameCounters[phase] = 0;
      this.phaseTimers[phase] = { start: 0, duration: 0 };
    });
  }

  processPose(landmarks, metrics) {
    throw new Error("processPose must be implemented by subclasses");
  }

  // Validate required landmarks are in view
  validatePose(landmarks) {
    return this.config.requiredLandmarks.every((index) =>
      isLandmarkInView(landmarks[index])
    );
  }

  // Change phases
  transitionTo(newState) {
    if (this.state === newState) {
      return false;
    }

    // Update timers for current phase
    if (this.state) {
      this.phaseTimers[this.state].duration =
        (Date.now() - this.phaseTimers[this.state].start) / 1000;
    }

    // Set new state, reset frame counter, start timer
    this.state = newState;
    this.frameCounters[newState] = 0;
    this.phaseTimers[newState].start = Date.now();

    // Trigger feedback
    const phaseConfig = this.config.phases[newState];
    this.onFeedback(phaseConfig.feedback.message, phaseConfig.feedback.type);

    return true;
  }

  // Get duration of a phase
  getPhaseDuration(phase) {
    return this.phaseTimers[phase].duration;
  }

  // Get start time of a phase
  getPhaseStartTime(phase) {
    return this.phaseTimers[phase].start;
  }

  // Reset exercise detector
  reset() {
    this.stats = { total: 0, valid: 0, invalid: 0 };
    this.transitionTo("NOT_VISIBLE");
  }
}
