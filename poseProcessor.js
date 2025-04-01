// Module handles MediaPipe initialization, video stream setup, and pose detection.

import {
  FilesetResolver,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

export class PoseProcessor {
  constructor(videoCanvas, onPoseDetected, onVideoDimensionsReady) {
    this.videoCanvas = videoCanvas;
    this.ctx = videoCanvas.getContext("2d");
    if (!this.ctx) {
      console.error("Failed to get 2D context for canvas");
      throw new Error("Failed to initialize canvas context");
    }
    console.log("PoseProcessor: Canvas context initialized:", this.ctx);
    this.onPoseDetected = onPoseDetected;
    this.onVideoDimensionsReady = onVideoDimensionsReady; // Callback to pass video dimensions
    this.poseLandmarker = null;
    this.videoStream = null;
    this.lastVideoTime = -1;
    this.isProcessing = true;
    this.videoElement = null;
    this.preferredAspectRatio = 16 / 9; // Define preferred aspect ratio
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
        // Add constraints to request a 16:9 resolution for better performance
        this.videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: this.preferredAspectRatio },
          },
        });
      }
      this.videoElement = document.createElement("video");
      this.videoElement.srcObject = this.videoStream;
      this.videoElement.onloadedmetadata = () => {
        this.videoElement.play();
        const videoWidth = this.videoElement.videoWidth;
        const videoHeight = this.videoElement.videoHeight;
        const videoAspectRatio = videoWidth / videoHeight;
        console.log(
          "Video started, width:",
          videoWidth,
          "height:",
          videoHeight,
          "aspect ratio:",
          videoAspectRatio
        );

        // Use the preferred aspect ratio (16:9) if the video's aspect ratio differs significantly
        const finalAspectRatio = this.preferredAspectRatio;
        console.log("Using preferred aspect ratio:", finalAspectRatio);

        // Pass the video dimensions and final aspect ratio to the callback
        if (this.onVideoDimensionsReady) {
          this.onVideoDimensionsReady({
            videoWidth,
            videoHeight,
            aspectRatio: finalAspectRatio,
          });
        }

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

      // Reset any transformations
      this.ctx.resetTransform();

      // Clear the canvas
      this.ctx.clearRect(0, 0, this.videoCanvas.width, this.videoCanvas.height);

      // Draw the video frame with letterboxing to preserve aspect ratio
      if (this.videoElement.readyState >= 2) {
        console.log(
          "Drawing video frame, video readyState:",
          this.videoElement.readyState,
          "video dimensions:",
          {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight,
          }
        );

        // Calculate the aspect ratio of the video and canvas
        const videoAspectRatio =
          this.videoElement.videoWidth / this.videoElement.videoHeight;
        const canvasAspectRatio =
          this.videoCanvas.width / this.videoCanvas.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (videoAspectRatio > canvasAspectRatio) {
          // Video is wider than canvas: fit by height, center horizontally
          drawHeight = this.videoCanvas.height;
          drawWidth = drawHeight * videoAspectRatio;
          offsetX = (this.videoCanvas.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Video is taller than canvas: fit by width, center vertically
          drawWidth = this.videoCanvas.width;
          drawHeight = drawWidth / videoAspectRatio;
          offsetX = 0;
          offsetY = (this.videoCanvas.height - drawHeight) / 2;
        }

        console.log("Drawing video with dimensions:", {
          drawWidth,
          drawHeight,
          offsetX,
          offsetY,
        });

        // Draw black letterbox bars if needed
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(
          0,
          0,
          this.videoCanvas.width,
          this.videoCanvas.height
        );

        // Draw the video
        this.ctx.drawImage(
          this.videoElement,
          offsetX,
          offsetY,
          drawWidth,
          drawHeight
        );
      } else {
        console.warn(
          "Video not ready to draw, readyState:",
          this.videoElement.readyState
        );
        this.ctx.fillStyle = "blue";
        this.ctx.fillRect(
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
