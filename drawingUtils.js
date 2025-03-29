// Module handles drawing landmarks and connections on the canvas.

import { DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { isLandmarkInView } from "./poseUtils.js";

export class CanvasDrawingUtils {
  constructor(videoCanvas) {
    this.videoCanvas = videoCanvas;
    this.ctx = videoCanvas.getContext("2d");
    this.drawingUtils = new DrawingUtils(this.ctx);
    this.exerciseLandmarks = {
      pushUp: {
        landmarks: [11, 12, 13, 14, 15, 16, 23, 24],
        connections: [
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
        ],
      },
    };
    this.alwaysDrawLandmarks = [
      0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28,
    ];
  }

  drawLandmarks(landmarks, exerciseType = "pushUp") {
    const config = this.exerciseLandmarks[exerciseType];
    if (!config) {
      console.error(
        `No drawing configuration found for exercise: ${exerciseType}`
      );
      return;
    }

    if (!landmarks || !Array.isArray(landmarks)) {
      console.log("No landmarks to draw");
      return;
    }

    // console.log("landmarks length:", landmarks.length);
    // console.log(
    //   "Raw landmarks at alwaysDrawLandmarks indices:",
    //   this.alwaysDrawLandmarks.map((index) => ({
    //     index,
    //     landmark: landmarks[index],
    //     isValid: landmarks[index] ? isLandmarkInView(landmarks[index]) : false,
    //   }))
    // );

    // Normalize landmark coordinates to canvas dimensions
    const normalizedLandmarks = landmarks.map((landmark) => {
      if (!isLandmarkInView(landmark)) {
        return null;
      }
      return {
        x: landmark.x * this.videoCanvas.width,
        y: landmark.y * this.videoCanvas.height,
        // Remove visibility property
      };
    });

    // console.log("normalizedLandmarks:", normalizedLandmarks);

    // Create a filtered array of landmarks to draw
    const landmarksToDraw = this.alwaysDrawLandmarks
      .map((index) => normalizedLandmarks[index])
      .filter((landmark) => landmark !== null);

    // console.log("landmarksToDraw before drawing:", landmarksToDraw);

    // Drawing style constants
    const DRAW_COLOUR = "#FFFFFF";
    const STROKE_WIDTH = 4;
    const DOT_RADIUS = 4;

    // Manually draw the landmarks as dots
    landmarksToDraw.forEach((landmark) => {
      this.ctx.beginPath();
      this.ctx.arc(landmark.x, landmark.y, DOT_RADIUS, 0, 2 * Math.PI);
      this.ctx.fillStyle = DRAW_COLOUR;
      this.ctx.fill();
    });

    // Draw connections for the exercise
    this.ctx.strokeStyle = DRAW_COLOUR;
    this.ctx.lineWidth = STROKE_WIDTH;
    for (const connection of config.connections) {
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
      this.ctx.strokeStyle = DRAW_COLOUR;
      this.ctx.lineWidth = STROKE_WIDTH;
      this.ctx.beginPath();
      this.ctx.moveTo(nose.x, nose.y);
      this.ctx.lineTo(midShoulderX, midShoulderY);
      this.ctx.stroke();
    }
  }
}
