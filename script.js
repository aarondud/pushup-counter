import {
  FilesetResolver,
  PoseLandmarker,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

// Initialize variables
let poseLandmarker;
let videoStream;
let lastVideoTime = -1;
let stats = { total: 0, valid: 0, invalid: 0 };
let status = "up";
let isProcessing = true;
let videoElement;

// DOM Elements
const videoCanvas = document.getElementById("videoCanvas");
const ctx = videoCanvas.getContext("2d");
const feedback = document.getElementById("feedback");
const counter = document.getElementById("counter");
const dataPoints = document.getElementById("dataPoints");
const themeToggle = document.getElementById("themeToggle");
const pauseButton = document.getElementById("pause");
const playButton = document.getElementById("play");
const pushUpStatsBody = document.getElementById("pushUpStatsBody");

// Verify DOM elements
console.log("Counter element:", counter);
console.log("PushUpStatsBody element:", pushUpStatsBody);

// Initialize DrawingUtils for drawing landmarks
const drawingUtils = new DrawingUtils(ctx);

// Initialize MediaPipe Pose Landmarker
async function initializePoseLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
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
    videoElement = document.createElement("video");
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
  console.log("Theme toggled to:", document.body.dataset.theme);
}
themeToggle.addEventListener("change", toggleTheme);

// Process each video frame
function processVideoFrame(videoElement) {
  if (!isProcessing) return;

  const currentTime = performance.now();
  if (currentTime - lastVideoTime > 100) {
    lastVideoTime = currentTime;
    ctx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
    ctx.drawImage(videoElement, 0, 0, videoCanvas.width, videoCanvas.height);
    console.log("Drawing video frame");
    if (poseLandmarker) {
      poseLandmarker.detectForVideo(videoElement, currentTime, (results) => {
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          console.log("Landmarks detected:", landmarks);
          drawLandmarks(landmarks);
          processPoseResults(results);
        }
      });
    } else {
      console.log("PoseLandmarker not ready yet");
    }
  }
  requestAnimationFrame(() => processVideoFrame(videoElement));
}

// Draw landmarks and connections on the canvas
function drawLandmarks(landmarks) {
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
      return null; // Skip invalid or out-of-frame landmarks
    }
    const normalized = {
      x: landmark.x * videoCanvas.width,
      y: landmark.y * videoCanvas.height,
    };
    console.log("Landmark:", normalized);
    return normalized;
  });

  // Filter out null landmarks for DrawingUtils
  const validLandmarks = normalizedLandmarks.filter(
    (landmark) => landmark !== null
  );

  // Draw connections using DrawingUtils
  drawingUtils.drawConnectors(validLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
    color: "#FFFFFF",
    lineWidth: 4,
  });
  drawingUtils.drawLandmarks(validLandmarks, {
    color: "#FFFFFF",
    radius: 4,
  });

  // Fallback: Manually draw landmarks and connections using canvas API
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;

  // Draw dots for each landmark
  for (const landmark of normalizedLandmarks) {
    if (landmark) {
      ctx.beginPath();
      ctx.arc(landmark.x, landmark.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // Draw connections using POSE_CONNECTIONS
  for (const connection of PoseLandmarker.POSE_CONNECTIONS) {
    const start = normalizedLandmarks[connection[0]];
    const end = normalizedLandmarks[connection[1]];
    if (start && end) {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
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
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
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
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
  }
}

// Calculate angle between three points
function calculateAngle(p1, p2, p3) {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  return Math.abs((radians * 180) / Math.PI);
}

// Check if a landmark is in view (x and y within [0, 1])
function isLandmarkInView(landmark) {
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

// Process pose detection results
function processPoseResults(results) {
  const landmarks = results.landmarks[0];
  if (!landmarks) {
    console.log("No landmarks in processPoseResults");
    feedback.textContent = "Please adjust the camera to show your body.";
    feedback.className = "feedback error show";
    updateDataPoints({
      leftElbowAngle: "N/A",
      rightElbowAngle: "N/A",
      leftWristDepth: "N/A",
      rightWristDepth: "N/A",
      shoulderHipAngle: "N/A",
      backStraightness: "N/A",
    });
    return;
  }

  // Left arm landmarks
  const leftShoulder = landmarks[11]; // Left shoulder
  const leftElbow = landmarks[13]; // Left elbow
  const leftWrist = landmarks[15]; // Left wrist
  // Right arm landmarks
  const rightShoulder = landmarks[12]; // Right shoulder
  const rightElbow = landmarks[14]; // Right elbow
  const rightWrist = landmarks[16]; // Right wrist
  // Other landmarks for additional metrics
  const hip = landmarks[23]; // Left hip
  const knee = landmarks[25]; // Left knee
  const ankle = landmarks[27]; // Left ankle

  // Check if upper body landmarks (required for push-up detection) are in view
  const requiredLandmarksForDetection = [
    leftShoulder,
    leftElbow,
    leftWrist,
    rightShoulder,
    rightElbow,
    rightWrist,
  ];
  const upperBodyInView = requiredLandmarksForDetection.every(isLandmarkInView);

  if (!upperBodyInView) {
    feedback.textContent =
      "Please adjust the camera to show your upper body for push-up counting.";
    feedback.className = "feedback error show";
    updateDataPoints({
      leftElbowAngle: "N/A",
      rightElbowAngle: "N/A",
      leftWristDepth: "N/A",
      rightWristDepth: "N/A",
      shoulderHipAngle: "N/A",
      backStraightness: "N/A",
    });
    return;
  }

  // If upper body is in view, show a green confirmation pop-up
  feedback.textContent = "Ready to count!";
  feedback.className = "feedback success show";

  // Calculate metrics for both arms
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  const leftWristDepth = leftWrist.y - leftElbow.y;
  const rightWristDepth = rightWrist.y - rightElbow.y;

  // Calculate shoulder-to-hip angle and back straightness (use estimated landmarks if necessary)
  const shoulderHipAngle =
    hip && knee ? calculateAngle(leftShoulder, hip, knee) : null;
  const backStraightness =
    hip && ankle ? calculateAngle(leftShoulder, hip, ankle) : null;

  // Use the average elbow angle and wrist depth for push-up detection
  const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
  const avgWristDepth = (leftWristDepth + rightWristDepth) / 2;

  // Log metrics for debugging
  console.log("Push-up metrics:", {
    avgElbowAngle: avgElbowAngle.toFixed(2),
    avgWristDepth: avgWristDepth.toFixed(2),
    status,
  });

  // Relaxed thresholds for push-up detection
  if (avgElbowAngle < 110 && avgWristDepth > 0.1 && status === "up") {
    status = "down";
    console.log("Push-up down phase detected", {
      avgElbowAngle,
      avgWristDepth,
    });
  } else if (avgElbowAngle > 140 && status === "down") {
    status = "up";
    stats.valid++;
    stats.total++;
    console.log("Push-up counted:", stats.valid);
    counter.textContent = `Push-Ups: ${stats.valid}`;
    console.log("Counter updated to:", counter.textContent);
    feedback.textContent = "Push-Up Counted!";
    feedback.className = "feedback success show";

    // Trigger background pulse animation
    document.body.classList.remove("pulse");
    void document.body.offsetWidth; // Force animation restart
    document.body.classList.add("pulse");

    // Play YEAHBUDDY sound
    new Audio("YEAHBUDDY.mp3").play();

    // Log push-up stats
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${stats.valid}</td>
      <td>${avgWristDepth.toFixed(2)}</td>
      <td>${backStraightness ? Math.round(backStraightness) : "N/A"}</td>
      <td>${shoulderHipAngle ? Math.round(shoulderHipAngle) : "N/A"}</td>
    `;
    pushUpStatsBody.appendChild(row);
    console.log("Stats table updated with new row");

    setTimeout(() => (feedback.className = "feedback"), 2000);
  } else if (avgElbowAngle > 110 && status === "down") {
    feedback.textContent = "Elbows Not Bent Enough";
    feedback.className = "feedback error show";
  } else if (avgWristDepth < 0.1 && status === "down") {
    feedback.textContent = "Too High";
    feedback.className = "feedback error show";
  }

  // Update data points in grid format
  updateDataPoints({
    leftElbowAngle: Math.round(leftElbowAngle),
    rightElbowAngle: Math.round(rightElbowAngle),
    leftWristDepth: leftWristDepth.toFixed(2),
    rightWristDepth: rightWristDepth.toFixed(2),
    shoulderHipAngle: shoulderHipAngle ? Math.round(shoulderHipAngle) : "N/A",
    backStraightness: backStraightness ? Math.round(backStraightness) : "N/A",
  });
}

// Helper function to update data points in grid format
function updateDataPoints({
  leftElbowAngle,
  rightElbowAngle,
  leftWristDepth,
  rightWristDepth,
  shoulderHipAngle,
  backStraightness,
}) {
  dataPoints.innerHTML = `
    <div class="data-points-grid">
      <div>
        <span class="label">Left Elbow Angle:</span>
        <span>${leftElbowAngle}°</span>
      </div>
      <div>
        <span class="label">Right Elbow Angle:</span>
        <span>${rightElbowAngle}°</span>
      </div>
      <div>
        <span class="label">Left Wrist Depth:</span>
        <span>${leftWristDepth}</span>
      </div>
      <div>
        <span class="label">Right Wrist Depth:</span>
        <span>${rightWristDepth}</span>
      </div>
      <div>
        <span class="label">Shoulder-Hip Angle:</span>
        <span>${shoulderHipAngle}°</span>
      </div>
      <div>
        <span class="label">Back Straightness:</span>
        <span>${backStraightness}°</span>
      </div>
    </div>
  `;
}

// Event Listeners
document.getElementById("reset").addEventListener("click", () => {
  stats.valid = 0;
  stats.total = 0;
  counter.textContent = "Push-Ups: 0";
  feedback.textContent = "";
  pushUpStatsBody.innerHTML = ""; // Clear stats table
  console.log("Counter reset to 0");
});

pauseButton.addEventListener("click", () => {
  isProcessing = false;
  videoElement.pause();
  pauseButton.disabled = true;
  playButton.disabled = false;
});

playButton.addEventListener("click", () => {
  isProcessing = true;
  videoElement.play();
  pauseButton.disabled = false;
  playButton.disabled = true;
  processVideoFrame(videoElement);
});

// Initialize the app
async function init() {
  await initializePoseLandmarker();
  await startProcessing();
}
init();
