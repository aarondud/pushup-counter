// Module handles all DOM updates and user interactions.

export class UIManager {
  constructor() {
    this.feedback = document.getElementById("feedback");
    this.counter = document.getElementById("counter");

    // Data elements
    this.dataPoints = document.getElementById("dataPoints");
    this.pushUpStatsTable = document.getElementById("pushUpStats");
    this.pushUpStatsBody = document.getElementById("pushUpStatsBody");

    // Modal elements
    this.tutorialModal = document.getElementById("tutorialModal");
    this.infoModal = document.getElementById("infoModal");

    // Controls
    this.pauseButton = document.getElementById("pause");
    this.playButton = document.getElementById("play");

    // Menu elements
    this.menuToggle = document.getElementById("menuToggle");
    this.sideMenu = document.getElementById("sideMenu");
    this.menuOverlay = document.getElementById("menuOverlay");
    this.menuToggle.addEventListener("click", () => this.toggleMenu());
    document.querySelector(".memoji-icon").addEventListener("click", () => {
      window.open("https://aarondudley.vercel.app", "_blank");
    });

    // Add elements to DOM
    document.body.appendChild(this.sideMenu);
    document.body.appendChild(this.menuOverlay);

    // Initialise
    this.currentCount = 0;
    this.currentMotion = "";
    this.lastDataPoints = null;

    this.setupEventListeners();
    this.initializeTheme();
    this.initSideMenu();

    // Show tutorial modal once
    if (!localStorage.getItem("tutorialShown")) {
      this.tutorialModal.classList.add("show");
      localStorage.setItem("tutorialShown", "true");
    }

    // Show tutorial modal every session
    // this.tutorialModal.classList.add("show");

    // Define the table headers dynamically
    const tableHeaders = [
      "#️⃣",
      "🏋️‍♀️  Activity",
      "⬇️  Down Duration",
      "⬆️  Up Duration",
      "⏱️  Ttl Duration",
    ];

    // Create the table header row dynamically
    const tableHead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // Loop through tableHeaders and create <th> elements for each
    tableHeaders.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      headerRow.appendChild(th);
    });

    // Append the header row to the table head
    tableHead.appendChild(headerRow);

    // Add the table head to the table
    this.pushUpStatsTable.appendChild(tableHead);
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

    document.getElementById("closeTutorial").addEventListener("click", () => {
      this.tutorialModal.classList.remove("show");
    });
  }

  updateFeedback(message, type) {
    this.feedback.textContent = message;
    this.feedback.className = `feedback ${type} show`;
  }

  updateMotionIndicator(motion) {
    this.currentMotion = motion;
    if (this.lastDataPoints) {
      this.updateDataPoints(this.lastDataPoints);
    }
  }

  updateCounter(count) {
    this.currentCount = count;
    this.counter.textContent = `Push-Ups: ${count}`;
    this.counter.classList.add("counter-animate");
  }

  formatMetric = (value, unit, precision) => {
    if (value == null || isNaN(value)) return "N/A";
    return `${Number(value).toFixed(precision)} ${unit}`;
  };

  updateDataPoints(metrics) {
    this.lastDataPoints = {
      leftElbowAngle: this.formatMetric(metrics.leftElbowAngle, "°", 0),
      rightElbowAngle: this.formatMetric(metrics.rightElbowAngle, "°", 0),
      avgWristDepth: this.formatMetric(metrics.avgWristDepth, "", 0.3),

      leftShoulderAngle: this.formatMetric(metrics.leftShoulderAngle, "°", 0),
      rightShoulderAngle: this.formatMetric(metrics.rightShoulderAngle, "°", 0),
      avgHeightDepth: this.formatMetric(metrics.avgHeightDepth, "", 0.3),

      leftHipAngle: this.formatMetric(metrics.leftHipAngle, "°", 0),
      rightHipAngle: this.formatMetric(metrics.rightHipAngle, "°", 0),
      avgHipAngle: this.formatMetric(metrics.avgHipAngle, "°", 0),

      leftKneeAngle: this.formatMetric(metrics.leftKneeAngle, "°", 0),
      rightKneeAngle: this.formatMetric(metrics.rightKneeAngle, "°", 0),
    };

    // Define labels & emojis for each metric
    const metricLabels = {
      leftElbowAngle: "💪 Left Elbow",
      rightElbowAngle: "💪 Right Elbow",
      avgWristDepth: "⬇️ Avg Wrist Depth",

      leftShoulderAngle: "🤷‍♂️ Left Shoulder",
      rightShoulderAngle: "🤷‍♂️ Right Shoulder",
      avgHeightDepth: "🧍‍♀️ Avg Height Depth",

      leftHipAngle: "🏃‍♂️ Left Hip",
      rightHipAngle: "🏃‍♂️ Right Hip",
      avgHipAngle: "📏 Back Straightness",

      leftKneeAngle: "🦵 Left Knee",
      rightKneeAngle: "🦵 Right Knee",
    };

    // Generate HTML
    this.dataPoints.innerHTML = `
      <div class="data-points-grid">
        ${Object.entries(this.lastDataPoints)
          .map(
            ([key, value]) => `
          <div>
            <span class="label">${metricLabels[key]}:</span>
            <span>${value}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  updateStatsTable({ count, activity, upDuration, downDuration }) {
    console.log("upDuration", upDuration, "downDuration", downDuration);
    const row = document.createElement("tr");

    activity = "Push-up";
    let ttlDuration = this.formatMetric(
      parseFloat(downDuration) + parseFloat(upDuration),
      "",
      2
    );

    row.innerHTML = `
        <td>${count}</td>
        <td>${activity}</td>
        <td>${downDuration}</td>
        <td>${upDuration}</td>
        <td>${ttlDuration}</td>
      `;
    this.pushUpStatsBody.appendChild(row);
  }

  triggerPulseAnimation() {
    document.body.classList.remove("pulse");
    void document.body.offsetWidth;
    document.body.classList.add("pulse");
    // Play sound when a push-up is counted
    new Audio("YEAHBUDDY.mp3").play().catch((error) => {
      console.error("Failed to play YEAHBUDDY.mp3:", error);
    });
  }

  initSideMenu() {
    // Sync theme toggle with current theme
    const isDarkMode = document.body.dataset.theme === "dark";
    this.sideMenu.querySelector("#menuThemeToggle").checked = isDarkMode;

    // Theme toggle handler
    this.sideMenu
      .querySelector("#menuThemeToggle")
      .addEventListener("change", (e) => {
        document.body.dataset.theme = e.target.checked ? "dark" : "light";
      });

    // Close button handler
    this.sideMenu
      .querySelector(".menu-close-btn")
      .addEventListener("click", () => {
        this.toggleMenu();
      });

    // Info button handler
    this.sideMenu.querySelector("#infoButton").addEventListener("click", () => {
      this.toggleMenu();
      this.infoModal.classList.add("show");
    });

    document.querySelector(".close-modal").addEventListener("click", () => {
      this.infoModal.classList.remove("show");
    });
  }

  toggleMenu() {
    this.menuToggle.classList.toggle("open");
    this.sideMenu.classList.toggle("open");
    this.menuOverlay.classList.toggle("active");

    // Toggle body scroll
    document.body.style.overflow = this.sideMenu.classList.contains("open")
      ? "hidden"
      : "";

    // Add/remove click outside listener
    if (this.sideMenu.classList.contains("open")) {
      document.addEventListener("click", this.handleClickOutside);
    } else {
      document.removeEventListener("click", this.handleClickOutside);
    }
  }

  // Use system preferences for default theme
  initializeTheme() {
    const prefersDarkScheme = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    document.body.dataset.theme = prefersDarkScheme ? "dark" : "light";
    return prefersDarkScheme;
  }

  // Close side menu by clicking outside
  handleClickOutside = (e) => {
    if (
      !this.sideMenu.contains(e.target) &&
      !this.menuToggle.contains(e.target) &&
      this.sideMenu.classList.contains("open")
    ) {
      this.toggleMenu();
    }
  };

  reset() {
    this.currentCount = 0;
    this.counter.textContent = "Push-Ups: 0";
    this.feedback.textContent = "";
    this.pushUpStatsBody.innerHTML = "";
    console.log("Counter reset to 0");
  }
}
