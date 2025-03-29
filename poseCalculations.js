// Module contains utility functions for calculating angles, wrist depths, and other metrics.

import { isLandmarkInView, calcAvg } from "./poseUtils.js";

export const PoseCalculations = {
  calculateAngle(p1, p2, p3) {
    const radians =
      Math.atan2(p3.y - p2.y, p3.x - p2.x) -
      Math.atan2(p1.y - p2.y, p1.x - p2.x);
    return Math.abs((radians * 180) / Math.PI);
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
    // Left leg landmarks
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const leftAnkle = landmarks[27];
    // Right leg landmarks
    const rightHip = landmarks[23];
    const rightKnee = landmarks[25];
    const rightAnkle = landmarks[27];

    const metrics = {
      leftElbowAngle: this.calculateAngle(leftShoulder, leftElbow, leftWrist),
      rightElbowAngle: this.calculateAngle(
        rightShoulder,
        rightElbow,
        rightWrist
      ),
      leftShoulderAngle: this.calculateAngle(leftHip, leftShoulder, leftElbow),
      rightShoulderAngle: this.calculateAngle(
        rightHip,
        rightShoulder,
        rightElbow
      ),
      leftHipAngle:
        leftHip && leftKnee
          ? this.calculateAngle(leftShoulder, leftHip, leftKnee)
          : null,
      rightHipAngle:
        rightHip && rightKnee
          ? this.calculateAngle(rightShoulder, rightHip, rightKnee)
          : null,
      leftKneeAngle:
        leftHip && leftKnee
          ? this.calculateAngle(leftHip, leftKnee, leftAnkle)
          : null,
      rightKneeAngle:
        rightHip && rightKnee
          ? this.calculateAngle(rightHip, rightKnee, rightAnkle)
          : null,
      leftWristDepth: leftWrist.y - leftElbow.y,
      rightWristDepth: rightWrist.y - rightElbow.y,

      leftShoulderDepth: leftShoulder.y - leftHip.y,
      rightShoulderDepth: rightShoulder.y - rightHip.y,

      leftHipDepth: leftHip.y - leftKnee.y,
      rightHipDepth: rightHip.y - rightKnee.y,

      leftBackStraightness:
        leftHip && leftKnee
          ? this.calculateAngle(leftShoulder, leftHip, leftKnee) // knee instead of ankle allows users to do knee pushups
          : null,
      rightBackStraightness:
        rightHip && rightKnee
          ? this.calculateAngle(rightShoulder, rightHip, rightKnee) // knee intead of ankle allows users to do knee pushups
          : null,
      upperBodyInView: [
        leftShoulder,
        leftElbow,
        leftWrist,
        rightShoulder,
        rightElbow,
        rightWrist,
      ].every(isLandmarkInView),
      fullBodyInView: [
        leftShoulder,
        leftElbow,
        leftWrist,
        rightShoulder,
        rightElbow,
        rightWrist,
        leftHip,
        leftKnee,
        leftAnkle,
        rightHip,
        rightKnee,
        rightAnkle,
      ].every(isLandmarkInView),
    };
    return {
      ...metrics,
      avgElbowAngle: calcAvg(metrics.leftElbowAngle, metrics.rightElbowAngle),
      avgHipAngle: calcAvg(metrics.leftHipAngle, metrics.rightHipAngle),
      avgKneeAngle: calcAvg(metrics.leftKneeAngle, metrics.rightKneeAngle),
      avgShoulderAngle: calcAvg(
        metrics.leftShoulderAngle,
        metrics.rightShoulderAngle
      ),
      avgWristDepth: calcAvg(metrics.leftWristDepth, metrics.rightWristDepth),

      avgHeightDepth: Math.abs(
        calcAvg(metrics.leftShoulderDepth, metrics.rightShoulderDepth) -
          calcAvg(metrics.leftHipDepth, metrics.rightHipDepth)
      ),

      avgBackStraightness: calcAvg(
        metrics.leftBackStraightness,
        metrics.rightBackStraightness
      ),
    };
  },
};
