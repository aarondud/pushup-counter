// Module contains utility functions for calculating angles, wrist depths, and other metrics.

import { isLandmarkInView, calcAvg, calculateAngle } from "./poseUtils.js";

export const PoseCalculations = {
  calculateMetrics(landmarks) {
    // Landmark references
    const leftShoulder = landmarks[11];
    const leftElbow = landmarks[13];
    const leftWrist = landmarks[15];
    const rightShoulder = landmarks[12];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const leftAnkle = landmarks[27];
    const rightHip = landmarks[24];
    const rightKnee = landmarks[26];
    const rightAnkle = landmarks[28];

    // Calculate individual metrics
    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(
      rightShoulder,
      rightElbow,
      rightWrist
    );
    const leftShoulderAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
    const rightShoulderAngle = calculateAngle(
      rightHip,
      rightShoulder,
      rightElbow
    );
    const leftHipAngle =
      leftHip && leftKnee
        ? calculateAngle(leftShoulder, leftHip, leftKnee)
        : null;
    const rightHipAngle =
      rightHip && rightKnee
        ? calculateAngle(rightShoulder, rightHip, rightKnee)
        : null;
    const leftKneeAngle =
      leftHip && leftKnee ? calculateAngle(leftHip, leftKnee, leftAnkle) : null;
    const rightKneeAngle =
      rightHip && rightKnee
        ? calculateAngle(rightHip, rightKnee, rightAnkle)
        : null;

    // Depth calculations
    const leftWristDepth = leftWrist.y - leftElbow.y;
    const rightWristDepth = rightWrist.y - rightElbow.y;
    const leftShoulderDepth = leftShoulder.y - leftHip.y;
    const rightShoulderDepth = rightShoulder.y - rightHip.y;
    const leftHipDepth = leftHip.y - leftKnee.y;
    const rightHipDepth = rightHip.y - rightKnee.y;

    // Structured metrics object
    return {
      angles: {
        elbow: {
          left: leftElbowAngle,
          right: rightElbowAngle,
          average: calcAvg(leftElbowAngle, rightElbowAngle),
        },
        shoulder: {
          left: leftShoulderAngle,
          right: rightShoulderAngle,
          average: calcAvg(leftShoulderAngle, rightShoulderAngle),
        },
        hip: {
          left: leftHipAngle,
          right: rightHipAngle,
          average: calcAvg(leftHipAngle, rightHipAngle),
        },
        knee: {
          left: leftKneeAngle,
          right: rightKneeAngle,
          average: calcAvg(leftKneeAngle, rightKneeAngle),
        },
      },
      depths: {
        wrist: {
          left: leftWristDepth,
          right: rightWristDepth,
          average: calcAvg(leftWristDepth, rightWristDepth),
        },
        shoulder: {
          left: leftShoulderDepth,
          right: rightShoulderDepth,
          average: calcAvg(leftShoulderDepth, rightShoulderDepth),
        },
        hip: {
          left: leftHipDepth,
          right: rightHipDepth,
          average: calcAvg(leftHipDepth, rightHipDepth),
        },
      },
    };
  },
};
