// Module handles drawing landmarks and connections on the canvas.

import {
  DrawingUtils,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

export class CanvasDrawingUtils {
  constructor(videoCanvas) {
    this.videoCanvas = videoCanvas;
    this.ctx = videoCanvas.getContext("2d");
    this.drawingUtils = new DrawingUtils(this.ctx);
  }

  drawLandmarks(landmarks) {
    // Normalize landmark coordinates to canvas dimensions
    const normalizedLandmarks = landmarks.map((landmark) => {
      if (
        !landmark ||
        typeof landmark.x !== "number" ||
        typeof landmark.y !== "number" ||
        landmark.x < 0 ||
        landmark.x > 1 ||
        landmark.y < 0 ||
        landmark.y > 1
      ) {
        return null;
      }
      return {
        x: landmark.x * this.videoCanvas.width,
        y: landmark.y * this.videoCanvas.height,
      };
    });

    // Filter out null landmarks for DrawingUtils
    const validLandmarks = normalizedLandmarks.filter(
      (landmark) => landmark !== null
    );

    // Draw connections using DrawingUtils
    this.drawingUtils.drawConnectors(
      validLandmarks,
      PoseLandmarker.POSE_CONNECTIONS,
      {
        color: "#FFFFFF",
        lineWidth: 4,
      }
    );
    this.drawingUtils.drawLandmarks(validLandmarks, {
      color: "#FFFFFF",
      radius: 4,
    });

    // Fallback: Manually draw landmarks and connections using canvas API
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.lineWidth = 4;

    // Draw dots for each landmark
    for (const landmark of normalizedLandmarks) {
      if (landmark) {
        this.ctx.beginPath();
        this.ctx.arc(landmark.x, landmark.y, 4, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    }

    // Draw connections using POSE_CONNECTIONS
    for (const connection of PoseLandmarker.POSE_CONNECTIONS) {
      const start = normalizedLandmarks[connection[0]];
      const end = normalizedLandmarks[connection[1]];
      if (start && end) {
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
      }
    }

    // Explicitly draw additional requested connections
    const additionalConnections = [
      [15, 13], // Left wrist to left elbow
      [16, 14], // Right wrist to right elbow
      [13, 11], // Left elbow to left shoulder
      [14, 12], // Right elbow to right shoulder
      [23, 25], // Left hip (waist) to left knee
      [24, 26], // Right hip (waist) to right knee
      [25, 27], // Left knee to left ankle
      [26, 28], // Right knee to right ankle
    ];

    for (const connection of additionalConnections) {
      const start = normalizedLandmarks[connection[0]];
      const end = normalizedLandmarks[connection[1]];
      if (start && end) {
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
      }
    }

    // Draw a bounding box around the torso (only if all landmarks are present)
    const torsoLandmarks = [
      normalizedLandmarks[11], // Left shoulder
      normalizedLandmarks[12], // Right shoulder
      normalizedLandmarks[23], // Left hip
      normalizedLandmarks[24], // Right hip
    ];
    if (torsoLandmarks.every((landmark) => landmark !== null)) {
      const minX = Math.min(...torsoLandmarks.map((l) => l.x));
      const maxX = Math.max(...torsoLandmarks.map((l) => l.x));
      const minY = Math.min(...torsoLandmarks.map((l) => l.y));
      const maxY = Math.max(...torsoLandmarks.map((l) => l.y));
      this.ctx.strokeStyle = "#FFFFFF";
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }
  }
}
