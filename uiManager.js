// Module handles all DOM updates and user interactions.

export class UIManager {
  constructor() {
    this.feedback = document.getElementById("feedback");
    this.counter = document.getElementById("counter");
    this.dataPoints = document.getElementById("dataPoints");
    this.themeToggle = document.getElementById("themeToggle");
    this.pauseButton = document.getElementById("pause");
    this.playButton = document.getElementById("play");
    this.pushUpStatsBody = document.getElementById("pushUpStatsBody");

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById("reset").addEventListener("click", () => {
      this.reset();
    });

    this.pauseButton.addEventListener("click", () => {
      this.pauseButton.disabled = true;
      this.playButton.disabled = false;
    });

    this.playButton.addEventListener("click", () => {
      this.pauseButton.disabled = false;
      this.playButton.disabled = true;
    });

    this.themeToggle.addEventListener("change", () => {
      document.body.dataset.theme = this.themeToggle.checked ? "dark" : "light";
      console.log("Theme toggled to:", document.body.dataset.theme);
    });
  }

  updateFeedback(message, type) {
    this.feedback.textContent = message;
    this.feedback.className = `feedback ${type} show`;
    if (type === "success") {
      setTimeout(() => (this.feedback.className = "feedback"), 2000);
    }
  }

  updateCounter(count) {
    this.counter.textContent = `Push-Ups: ${count}`;
  }

  updateDataPoints({
    leftElbowAngle,
    rightElbowAngle,
    leftWristDepth,
    rightWristDepth,
    shoulderHipAngle,
    backStraightness,
  }) {
    this.dataPoints.innerHTML = `
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

  updateStatsTable({
    count,
    avgWristDepth,
    backStraightness,
    shoulderHipAngle,
  }) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${count}</td>
        <td>${avgWristDepth}</td>
        <td>${backStraightness}</td>
        <td>${shoulderHipAngle}</td>
      `;
    this.pushUpStatsBody.appendChild(row);
  }

  triggerPulseAnimation() {
    document.body.classList.remove("pulse");
    void document.body.offsetWidth; // Force animation restart
    document.body.classList.add("pulse");
    new Audio("YEAHBUDDY.mp3").play();
  }

  reset() {
    this.counter.textContent = "Push-Ups: 0";
    this.feedback.textContent = "";
    this.pushUpStatsBody.innerHTML = "";
    console.log("Counter reset to 0");
  }
}
