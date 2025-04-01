// Module defines a base class for exercise detection, which can be extended for different exercises.

import { isLandmarkInView } from "../poseUtils.js";

export class ExerciseDetector {
  constructor(onExerciseDetected, onFeedback, config) {
    this.onExerciseDetected = onExerciseDetected; // Callback for when an exercise is detected
    this.onFeedback = onFeedback;
    this.config = config;

    // TO DO needed?
    // Validate config.phases exists
    if (!this.config.phases) {
      console.error("Missing phases in config");
      this.config.phases = {};
    }

    // Initialise velocity tracking
    this.prevAngle = null;
    this.angleVelocity = 0;
    this.velocityBuffer = [];
    this.DELTA_DEG_PER_FRAME = 0.3;
    this.VEL_BUFFER_SIZE = 5;

    // State management
    this.state = "NOT_VISIBLE";
    this.stats = { total: 0, valid: 0, invalid: 0 };
    this.minAngles = {};
    this.currentRepMinAngles = {};

    // Initialize phase tracking
    this.frameCounters = {};
    this.phaseTimers = {};
    Object.keys(config.phases).forEach((phase) => {
      this.frameCounters[phase] = 0;
      this.phaseTimers[phase] = { start: 0, duration: 0 };
    });

    // TODO needed?
    // Ensure default state exists in timers
    if (!this.phaseTimers[this.state]) {
      this.phaseTimers[this.state] = { start: Date.now(), duration: 0 };
    }
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

  transitionTo(newState) {
    if (this.state === newState) return false;

    // Ensure phaseTimers exists for current state
    if (!this.phaseTimers) this.phaseTimers = {};

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

  updateMinAngles(metrics) {
    if (!this.config.keyMetrics || !Array.isArray(this.config.keyMetrics)) {
      console.error(
        "Invalid keyMetrics configuration:",
        this.config.keyMetrics
      );
      return;
    }

    this.config.keyMetrics.forEach((angleName) => {
      if (!metrics.angles[angleName]) {
        console.warn(`Missing angle data for: ${angleName}`);
        return;
      }

      const currentAngle = metrics.angles[angleName].average;
      if (currentAngle === null || currentAngle === undefined) return;

      if (
        !this.currentRepMinAngles[angleName] ||
        currentAngle < this.currentRepMinAngles[angleName]
      ) {
        this.currentRepMinAngles[angleName] = currentAngle;
      }
    });
  }

  updateVelocity(currentAngle) {
    if (this.prevAngle !== null) {
      this.velocityBuffer.push(currentAngle - this.prevAngle);
      if (this.velocityBuffer.length > this.VEL_BUFFER_SIZE) {
        this.velocityBuffer.shift();
      }
    }
    this.prevAngle = currentAngle;
  }

  get isDescending() {
    return (
      this.velocityBuffer.length >= this.VEL_BUFFER_SIZE &&
      this.velocityBuffer.every((v) => v < -this.DELTA_DEG_PER_FRAME)
    );
  }

  get isAscending() {
    return (
      this.velocityBuffer.length >= this.VEL_BUFFER_SIZE &&
      this.velocityBuffer.every((v) => v > this.DELTA_DEG_PER_FRAME)
    );
  }

  logCompletedRep(metrics) {
    this.stats.valid++;
    const now = new Date();

    this.onExerciseDetected({
      activityType: this.config.name,
      emoji: this.config.icon,
      totalCount: this.stats.valid,
      timestamp: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      keyAngles: { ...this.currentRepMinAngles },
      durations: {
        down: this.getPhaseDuration("DOWN"),
        up: this.getPhaseDuration("UP"),
      },
    });

    this.currentRepMinAngles = {};
  }

  // Reset exercise detector
  reset() {
    this.stats = { total: 0, valid: 0, invalid: 0 };
    this.transitionTo("NOT_VISIBLE");
  }
}
