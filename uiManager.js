// Module handles all DOM updates and user interactions.

export class UIManager {
  constructor(exerciseManager) {
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
    this.lastDataPoints = null;

    this.exerciseManager = exerciseManager;
    this.setupEventListeners();
    this.initializeTheme();
    this.initSideMenu();

    this.initDropdown("counterBtn", "exerciseDropdown");
    this.initDropdown("sideMenuExerciseBtn", "sideMenuExerciseDropdown");

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

    // Generate HTML for live data points
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

  updateActivityLog({ count, upDuration, downDuration }) {
    const currentActivity = this.exerciseManager.getCurrentExercise();
    // console.log("upDuration", upDuration, "downDuration", downDuration);
    const ttlDuration = this.formatMetric(
      parseFloat(downDuration) + parseFloat(upDuration),
      "",
      2
    );

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${count}</td>
        <td>${currentActivity}</td>
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
    this.playExerciseSound();
  }

  triggerExerciseChangeFeedback() {
    const counterBtn = document.getElementById("counterBtn");
    counterBtn.classList.add("pulse");
    setTimeout(() => counterBtn.classList.remove("pulse"), 300);
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

  initSoundControls() {
    // Mute toggle
    document.getElementById("soundToggle").addEventListener("change", (e) => {
      this.exerciseManager.isMuted = e.target.checked;
    });

    // Sound selector dropdown
    const soundSelector = document.getElementById("audioTheme");
    soundSelector.addEventListener("change", (e) => {
      this.exerciseManager.setCurrentSound(e.target.value);
    });
  }

  playExerciseSound() {
    if (this.exerciseManager.isMuted) return;

    const soundPath = this.exerciseManager.getCurrentExercise().currentSound;
    new Audio(soundPath).play().catch((e) => console.warn("Sound error:", e));
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

  updateUIForExercise(exercise = this.exerciseManager.getCurrentExercise()) {
    // Update both dropdown buttons
    ["counterBtn", "sideMenuExerciseBtn"].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        const nameEl =
          btn.querySelector(".exercise-name") ||
          btn.querySelector("#exerciseName");
        const countEl =
          btn.querySelector(".exercise-count") ||
          btn.querySelector("#exerciseCount");
        if (nameEl) nameEl.textContent = exercise.name;
        if (countEl) countEl.textContent = exercise.counts || 0;
      }
    });

    // Update CSS variable
    document.documentElement.style.setProperty(
      "--exercise-primary",
      exercise.color
    );

    // Update counter text
    if (this.counter) {
      this.counter.textContent = `${exercise.name}: ${exercise.counts || 0}`;
    }

    // Update body data attribute for theme-specific styling
    document.body.dataset.exercise = this.exerciseManager.currentExercise;
  }

  initDropdown(buttonId, menuId) {
    const btn = document.getElementById(buttonId);
    const menu = document.getElementById(menuId);

    if (!btn || !menu) return;

    // Define handlers as regular functions
    const handleButtonClick = (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (menu.classList.contains("show")) {
        menu.classList.add("closing");
        menu.addEventListener(
          "animationend",
          () => {
            menu.classList.remove("show", "closing");
          },
          { once: true }
        );
      } else {
        menu.classList.add("show");
      }
    };

    const handleOutsideClick = () => {
      if (menu.classList.contains("show")) {
        menu.classList.add("closing");
        menu.addEventListener(
          "animationend",
          () => {
            menu.classList.remove("show", "closing");
          },
          { once: true }
        );
      }
    };

    const handleOptionClick = (e) => {
      e.stopPropagation();
      const exerciseType = e.target.dataset.exercise;
      // Dispatch the correct event name that ExerciseApp listens for
      document.dispatchEvent(
        new CustomEvent("exerciseChange", {
          detail: { exerciseType },
        })
      );
      handleOutsideClick();
    };

    // Set up event listeners
    btn.addEventListener("click", handleButtonClick);
    document.addEventListener("click", handleOutsideClick);
    menu.querySelectorAll("button").forEach((option) => {
      option.addEventListener("click", handleOptionClick);
    });

    // Store references for cleanup if needed
    this._dropdownHandlers = this._dropdownHandlers || [];
    this._dropdownHandlers.push({
      btn,
      menu,
      handleButtonClick,
      handleOutsideClick,
      handleOptionClick,
    });
  }

  reset() {
    this.currentCount = 0;
    this.counter.textContent = "Push-Ups: 0";
    this.feedback.textContent = "";
    this.pushUpStatsBody.innerHTML = "";
    console.log("Counter reset to 0");
  }
}
