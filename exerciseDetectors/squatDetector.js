import { ExerciseDetector } from "./exerciseDetector.js";

export class SquatDetector extends ExerciseDetector {
  constructor(onExerciseDetected, onFeedback, config) {
    super(onExerciseDetected, onFeedback, config);
    this.DELTA_DEG_PER_FRAME = 0.3;
    this.VEL_BUFFER_SIZE = 5;
  }

  processPose(landmarks, metrics) {
    return;
  }
}
