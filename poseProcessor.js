// Module handles MediaPipe initialization, video stream setup, and pose detection.

import {
  FilesetResolver,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

export class PoseProcessor {
  constructor(videoCanvas, onPoseDetected) {
    this.videoCanvas = videoCanvas;
    this.ctx = videoCanvas.getContext("2d");
    this.onPoseDetected = onPoseDetected;
    this.poseLandmarker = null;
    this.videoStream = null;
    this.lastVideoTime = -1;
    this.isProcessing = true;
    this.videoElement = null;
  }

  async initialize() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      console.log("PoseLandmarker initialized successfully");
      await this.startVideoStream();
    } catch (error) {
      console.error("Failed to initialize PoseLandmarker:", error);
      throw new Error("Error loading pose detection. Allow camera access.");
    }
  }

  async startVideoStream() {
    try {
      if (!this.videoStream) {
        this.videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }
      this.videoElement = document.createElement("video");
      this.videoElement.srcObject = this.videoStream;
      this.videoElement.onloadedmetadata = () => {
        this.videoElement.play();
        console.log(
          "Video started, width:",
          this.videoElement.videoWidth,
          "height:",
          this.videoElement.videoHeight
        );
        console.log("Canvas dimensions on video start:", {
          width: this.videoCanvas.width,
          height: this.videoCanvas.height,
        });
        this.processVideoFrame();
      };
    } catch (error) {
      console.error("Webcam error:", error);
      throw new Error(
        "Webcam access denied. Please enable access and try again."
      );
    }
  }

  processVideoFrame() {
    if (!this.isProcessing) return;

    const currentTime = performance.now();
    if (currentTime - this.lastVideoTime > 100) {
      this.lastVideoTime = currentTime;

      console.log("Canvas dimensions before drawing video frame:", {
        width: this.videoCanvas.width,
        height: this.videoCanvas.height,
      });

      // Clear the canvas
      this.ctx.clearRect(0, 0, this.videoCanvas.width, this.videoCanvas.height);

      // Draw the video frame
      if (this.videoElement.readyState >= 2) {
        console.log(
          "Drawing video frame, video readyState:",
          this.videoElement.readyState
        );
        this.ctx.drawImage(
          this.videoElement,
          0,
          0,
          this.videoCanvas.width,
          this.videoCanvas.height
        );
      }

      if (this.poseLandmarker) {
        this.poseLandmarker.detectForVideo(
          this.videoElement,
          currentTime,
          (results) => {
            if (results.landmarks && results.landmarks.length > 0) {
              this.onPoseDetected(results);
            }
          }
        );
      } else {
        console.log("PoseLandmarker not ready yet");
      }
    }
    requestAnimationFrame(() => this.processVideoFrame());
  }

  pause() {
    this.isProcessing = false;
    this.videoElement.pause();
  }

  play() {
    this.isProcessing = true;
    this.videoElement.play();
    this.processVideoFrame();
  }
}
