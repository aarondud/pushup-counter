// Module contains utility functions for calculating angles, wrist depths, and other metrics.

export const PoseCalculations = {
  calculateAngle(p1, p2, p3) {
    const radians =
      Math.atan2(p3.y - p2.y, p3.x - p2.x) -
      Math.atan2(p1.y - p2.y, p1.x - p2.x);
    return Math.abs((radians * 180) / Math.PI);
  },

  isLandmarkInView(landmark) {
    return (
      landmark &&
      typeof landmark.x === "number" &&
      typeof landmark.y === "number" &&
      landmark.x >= 0 &&
      landmark.x <= 1 &&
      landmark.y >= 0 &&
      landmark.y <= 1
    );
  },

  calculateMetrics(landmarks) {
    // Left arm landmarks
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    // Right arm landmarks
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];
    // Other landmarks for additional metrics
    const hip = landmarks[23];
    const knee = landmarks[25];
    const ankle = landmarks[27];

    const metrics = {
      leftElbowAngle: this.calculateAngle(leftShoulder, leftElbow, leftWrist),
      rightElbowAngle: this.calculateAngle(
        rightShoulder,
        rightElbow,
        rightWrist
      ),
      leftWristDepth: leftWrist.y - leftElbow.y,
      rightWristDepth: rightWrist.y - rightElbow.y,
      shoulderHipAngle:
        hip && knee ? this.calculateAngle(leftShoulder, hip, knee) : null,
      backStraightness:
        hip && ankle ? this.calculateAngle(leftShoulder, hip, ankle) : null,
      upperBodyInView: [
        leftShoulder,
        leftElbow,
        leftWrist,
        rightShoulder,
        rightElbow,
        rightWrist,
      ].every(this.isLandmarkInView),
    };

    return {
      ...metrics,
      avgElbowAngle: (metrics.leftElbowAngle + metrics.rightElbowAngle) / 2,
      avgWristDepth: (metrics.leftWristDepth + metrics.rightWristDepth) / 2,
    };
  },
};
