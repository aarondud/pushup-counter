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
        this.videoCanvas.width = this.videoElement.videoWidth;
        this.videoCanvas.height = this.videoElement.videoHeight;
        this.videoElement.play();
        console.log("Video started, width:", this.videoElement.videoWidth);
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
      this.ctx.clearRect(0, 0, this.videoCanvas.width, this.videoCanvas.height);
      this.ctx.drawImage(
        this.videoElement,
        0,
        0,
        this.videoCanvas.width,
        this.videoCanvas.height
      );
      console.log("Drawing video frame");
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
