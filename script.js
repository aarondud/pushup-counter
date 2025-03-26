import {
  FilesetResolver,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// Initialize variables
let poseLandmarker;
let videoStream;
let lastVideoTime = -1;
let stats = { total: 0, valid: 0, invalid: 0 };
let status = "up";
let isProcessing = true;

// DOM Elements
const videoCanvas = document.getElementById("videoCanvas");
const ctx = videoCanvas.getContext("2d");
const feedback = document.getElementById("feedback");
const counter = document.getElementById("counter");
const dataPoints = document.getElementById("dataPoints");
const themeToggle = document.getElementById("themeToggle");
const instructions = document.querySelector(".instructions");

// Initialize MediaPipe Pose Landmarker
async function initializePoseLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });
    console.log("PoseLandmarker initialized successfully");
  } catch (error) {
    console.error("Failed to initialize PoseLandmarker:", error);
    feedback.textContent = "Error loading pose detection. Refresh the page.";
    feedback.className = "feedback error show";
  }
}

// Start webcam and processing
async function startProcessing() {
  try {
    if (!videoStream) {
      videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    }
    const videoElement = document.createElement("video");
    videoElement.srcObject = videoStream;
    videoElement.onloadedmetadata = () => {
      videoCanvas.width = videoElement.videoWidth;
      videoCanvas.height = videoElement.videoHeight;
      videoElement.play();
      console.log("Video started, width:", videoElement.videoWidth);
      processVideoFrame(videoElement);
    };
  } catch (error) {
    console.error("Webcam error:", error);
    feedback.textContent =
      "Webcam access denied. Please enable access and try again.";
    feedback.className = "feedback error show";
    setTimeout(() => (feedback.className = "feedback"), 5000);
  }
}

// Dark mode toggle
function toggleTheme() {
  document.body.dataset.theme = themeToggle.checked ? "dark" : "light";
}
themeToggle.addEventListener("change", toggleTheme);

// Process each video frame
function processVideoFrame(videoElement) {
  if (!isProcessing) return;

  const currentTime = performance.now();
  if (currentTime - lastVideoTime > 100) {
    lastVideoTime = currentTime;
    ctx.clearRect(0, 0, videoCanvas.width, videoCanvas.height); // Clear canvas
    ctx.drawImage(videoElement, 0, 0, videoCanvas.width, videoCanvas.height); // Draw video
    if (poseLandmarker) {
      poseLandmarker.detectForVideo(videoElement, currentTime, (results) => {
        if (results.landmarks && results.landmarks.length > 0) {
          processPoseResults(results);
        } else {
          console.log("No landmarks detected");
        }
      });
    } else {
      console.log("PoseLandmarker not ready yet");
    }
  }
  requestAnimationFrame(() => processVideoFrame(videoElement));
}

// Calculate angle between three points
function calculateAngle(p1, p2, p3) {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  return Math.abs((radians * 180) / Math.PI);
}

// Process pose detection results
function processPoseResults(results) {
  const landmarks = results.landmarks[0];
  if (!landmarks) return;

  // Extract key points
  const shoulder = landmarks[11]; // Left shoulder
  const elbow = landmarks[13]; // Left elbow
  const wrist = landmarks[15]; // Left wrist
  const feetVisible = landmarks
    .slice(27, 33)
    .every((point) => point.visibility > 0.5);

  // Calculate angles and depth
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  const wristDepth = wrist.y - elbow.y;

  // Check push-up status
  if (elbowAngle < 90 && wristDepth > 0.2 && status === "up" && feetVisible) {
    status = "down";
    instructions.style.display = "none";
  } else if (elbowAngle > 160 && status === "down") {
    status = "up";
    stats.valid++;
    stats.total++;
    counter.textContent = `Push-Ups: ${stats.valid}`;
    feedback.textContent = "Push-Up Counted!";
    feedback.className = "feedback success show";
    new Audio("beep.mp3").play();
    setTimeout(() => (feedback.className = "feedback"), 2000);
  } else if (!feetVisible) {
    feedback.textContent = "Move into frame";
    feedback.className = "feedback error show";
    instructions.style.display = "block";
  } else if (elbowAngle > 90 && status === "down") {
    feedback.textContent = "Elbows Not Bent Enough";
    feedback.className = "feedback error show";
  } else if (wristDepth < 0.2 && status === "down") {
    feedback.textContent = "Too High";
    feedback.className = "feedback error show";
  }

  // Display key data points
  dataPoints.textContent = `Elbow Angle: ${Math.round(
    elbowAngle
  )}°, Wrist Depth: ${wristDepth.toFixed(2)}`;
}

// Event Listeners
document.getElementById("reset").addEventListener("click", () => {
  stats.valid = 0;
  counter.textContent = "Push-Ups: 0";
  feedback.textContent = "";
});

// Initialize the app
async function init() {
  await initializePoseLandmarker();
  await startProcessing();
}
init();
