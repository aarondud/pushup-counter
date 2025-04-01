/**
 * Validates a pose landmark by checking if it exists and has valid x and y coordinates.
 * @param {Object} landmark - The landmark object with x and y properties.
 * @returns {boolean} - True if the landmark is valid, false otherwise.
 */
export function isLandmarkInView(landmark) {
  return (
    landmark &&
    typeof landmark.x === "number" &&
    typeof landmark.y === "number" &&
    landmark.x >= 0 &&
    landmark.x <= 1 &&
    landmark.y >= 0 &&
    landmark.y <= 1
  );
}

// Calculates the angle between three points (p1, p2, p3)
export function calculateAngle(p1, p2, p3) {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  return Math.abs((radians * 180) / Math.PI);
}

// Calculate the 3D angle between three points (p1, p2, p3)
export function calc3DAngle(p1, p2, p3) {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: p3.z - p2.z };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);
  const radians = Math.acos(dot / (mag1 * mag2));
  return radians * (180 / Math.PI);
}

// Calculate the average 3D angle for left and right sides
export function avg3DAngle(leftIndices, rightIndices, landmarks) {
  const leftAngle = calc3DAngle(
    landmarks[leftIndices[0]],
    landmarks[leftIndices[1]],
    landmarks[leftIndices[2]]
  );
  const rightAngle = calc3DAngle(
    landmarks[rightIndices[0]],
    landmarks[rightIndices[1]],
    landmarks[rightIndices[2]]
  );
  return (leftAngle + rightAngle) / 2;
}

// Calculate the midpoint of two landmarks
export function avgLandmarks(lm1, lm2) {
  return {
    x: (lm1.x + lm2.x) / 2,
    y: (lm1.y + lm2.y) / 2,
    z: (lm1.z + lm2.z) / 2,
    visibility: Math.min(lm1.visibility, lm2.visibility),
  };
}

// Calculate the average of an array of numbers
export function avg(array) {
  return array.reduce((a, b) => a + b, 0) / array.length;
}

// Caclulate the average of two variables
export function calcAvg(var1, var2) {
  return (var1 + var2) / 2;
}

export function isWristDepthInRange({ avgWristDepth }, { wristDepthMax }) {
  return avgWristDepth <= wristDepthMax;
}

export function isBackStraight({ avgHipAngle }, { backMin, backMax }) {
  return avgHipAngle >= backMin && avgHipAngle <= backMax;
}

export function isBackHeightInRange({ avgHeightDepth }, { heightDiffMax }) {
  return avgHeightDepth <= heightDiffMax;
}
