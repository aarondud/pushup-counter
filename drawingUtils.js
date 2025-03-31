// Module handles drawing landmarks and connections on the canvas.

import { DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { isLandmarkInView } from "./poseUtils.js";

export class CanvasDrawingUtils {
  constructor(videoCanvas) {
    this.videoCanvas = videoCanvas;
    this.ctx = videoCanvas.getContext("2d");
    this.drawingUtils = new DrawingUtils(this.ctx);
    this.alwaysDrawLandmarks = [
      0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28,
    ];
    this.alwaysDrawConnections = [
      [11, 12],
      [11, 13],
      [12, 14],
      [13, 15],
      [14, 16],
      [11, 23],
      [12, 24],
      [23, 24],
      [23, 25],
      [24, 26],
      [25, 27],
      [26, 28],
    ]; // excludes neck
    this.defaultStyles = {
      landmarkColor: "#FFFFFF",
      connectionColor: "#FFFFFF",
      landmarkRadius: 4,
      connectionWidth: 4,
    };
    this.LANDMARK_RADIUS_RANGE = {
      min: 2,
      max: 50,
      default: this.defaultStyles.landmarkRadius,
    };
    this.CONNECTION_WIDTH_RANGE = {
      min: 2,
      max: 40,
      default: this.defaultStyles.connectionWidth,
    };
    this.customStyles = { ...this.defaultStyles };
    this.useDefault = true;
  }

  getLandmarkRadiusRange() {
    return this.LANDMARK_RADIUS_RANGE;
  }

  getConnectionWidthRange() {
    return this.CONNECTION_WIDTH_RANGE;
  }

  setStyles({
    landmarkColor,
    connectionColor,
    landmarkRadius,
    connectionWidth,
    useDefault,
  }) {
    this.useDefault = useDefault;
    if (!useDefault) {
      this.customStyles = {
        landmarkColor,
        connectionColor,
        landmarkRadius,
        connectionWidth,
      };
    }
  }
  setStyles({
    landmarkColor,
    connectionColor,
    landmarkRadius,
    connectionWidth,
    useDefault,
  }) {
    this.useDefault = useDefault;
    if (!useDefault) {
      this.customStyles = {
        landmarkColor,
        connectionColor,
        landmarkRadius,
        connectionWidth,
      };
    }
  }

  getCurrentStyles() {
    return this.useDefault ? this.defaultStyles : this.customStyles;
  }

  drawLandmarks(landmarks) {
    if (!landmarks || !Array.isArray(landmarks)) return;

    const { landmarkColor, connectionColor, landmarkRadius, connectionWidth } =
      this.getCurrentStyles();

    // Normalize landmark coordinates to canvas dimensions
    const normalizedLandmarks = landmarks.map((landmark) => {
      if (!isLandmarkInView(landmark)) {
        return null;
      }
      return {
        x: landmark.x * this.videoCanvas.width,
        y: landmark.y * this.videoCanvas.height,
      };
    });

    // console.log("landmarks length:", landmarks.length);
    // console.log(
    //   "Raw landmarks at alwaysDrawLandmarks indices:",
    //   this.alwaysDrawLandmarks.map((index) => ({
    //     index,
    //     landmark: landmarks[index],
    //     isValid: landmarks[index] ? isLandmarkInView(landmarks[index]) : false,
    //   }))
    // );
    // console.log("normalizedLandmarks:", normalizedLandmarks);
    // console.log("landmarksToDraw before drawing:", landmarksToDraw);

    // Draw connections for the exercise
    this.ctx.strokeStyle = connectionColor;
    this.ctx.lineWidth = connectionWidth;
    // for (const connection of config.connections) {
    for (const connection of this.alwaysDrawConnections) {
      const start = normalizedLandmarks[connection[0]];
      const end = normalizedLandmarks[connection[1]];
      if (start && end) {
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
      }
    }

    // Draw connection from nose (0) to midpoint of shoulders (11, 12)
    const nose = normalizedLandmarks[0];
    const leftShoulder = normalizedLandmarks[11];
    const rightShoulder = normalizedLandmarks[12];
    if (nose && leftShoulder && rightShoulder) {
      const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
      const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
      this.ctx.strokeStyle = connectionColor;
      this.ctx.lineWidth = connectionWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(nose.x, nose.y);
      this.ctx.lineTo(midShoulderX, midShoulderY);
      this.ctx.stroke();
    }

    // Create a filtered array of landmarks to draw
    const landmarksToDraw = this.alwaysDrawLandmarks
      .map((index) => normalizedLandmarks[index])
      .filter((landmark) => landmark !== null);

    // Manually draw the landmarks as dots
    landmarksToDraw.forEach((landmark) => {
      this.ctx.beginPath();
      this.ctx.arc(landmark.x, landmark.y, landmarkRadius, 0, 2 * Math.PI);
      this.ctx.fillStyle = landmarkColor;
      this.ctx.fill();
    });
  }
}
