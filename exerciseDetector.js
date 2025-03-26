// Module defines a base class for exercise detection, which can be extended for different exercises.

export class ExerciseDetector {
  constructor(onExerciseDetected) {
    this.onExerciseDetected = onExerciseDetected; // Callback for when an exercise is detected
    this.stats = { total: 0, valid: 0, invalid: 0 };
  }

  processPose(landmarks, metrics) {
    throw new Error("processPose must be implemented by subclasses");
  }

  reset() {
    this.stats = { total: 0, valid: 0, invalid: 0 };
  }
}
