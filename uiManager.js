// Module handles all DOM updates and user interactions.

export class UIManager {
  constructor(exerciseManager) {
    this.feedback = document.getElementById("feedback");
    this.counter = document.getElementById("counter");
    this.isMuted = false;

    // Data elements
    this.dataPoints = document.getElementById("dataPoints");
    this.activityLog = document.getElementById("activityLog");
    this.activityLogBody = document.getElementById("activityLogBody");

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
    this.lastCustomStyles = null;

    // Add elements to DOM
    document.body.appendChild(this.sideMenu);
    document.body.appendChild(this.menuOverlay);

    // Define single source of truth for metrics
    this.metricConfig = {
      // Left Metrics
      leftElbowAngle: {
        label: "💪 Left Elbow",
        value: "N/A",
        group: "left",
      },
      leftShoulderAngle: {
        label: "🤷‍♂️ Left Shoulder",
        value: "N/A",
        group: "left",
      },
      leftHipAngle: {
        label: "🏃‍♂️ Left Hip",
        value: "N/A",
        group: "left",
      },
      leftKneeAngle: {
        label: "🦵 Left Knee",
        value: "N/A",
        group: "left",
      },
      // Right Metrics
      rightElbowAngle: {
        label: "💪 Right Elbow",
        value: "N/A",
        group: "right",
      },
      rightShoulderAngle: {
        label: "🤷‍♂️ Right Shoulder",
        value: "N/A",
        group: "right",
      },
      rightHipAngle: {
        label: "🏃‍♂️ Right Hip",
        value: "N/A",
        group: "right",
      },
      rightKneeAngle: {
        label: "🦵 Right Knee",
        value: "N/A",
        group: "right",
      },
      // Other Metrics
      avgWristDepth: {
        label: "⬇️ Wrist Depth",
        value: "N/A",
        group: "other",
      },
      avgHeightDepth: {
        label: "🧍‍♀️ Height Depth",
        value: "N/A",
        group: "other",
      },
      avgHipAngle: {
        label: "📏 Back Angle",
        value: "N/A",
        group: "other",
      },
      placeholder: {
        label: "📏 Placeholder",
        value: "N/A",
        group: "other",
      },
    };
    this.ANGLE_PRECISION = 0;
    this.OTHER_METRIC_PRECISION = 0.3;
    this.ANGLE_UNIT = "°";

    // Initialise
    this.currentCount = 0;
    this.lastDataPoints = null;

    this.exerciseManager = exerciseManager;
    this.updateUIForExercise();
    this.drawingUtils = null;
    this.renderMetrics();
    this.setupEventListeners();
    this.initializeTheme();
    this.initDropdown("counterBtn", "exerciseDropdown");
    this.initSideMenu();
    this.initSoundControls();

    // Show tutorial modal once
    // Show tutorial modal every session
    // this.tutorialModal.classList.add("show");
    if (!localStorage.getItem("tutorialShown")) {
      this.tutorialModal.classList.add("show");
      localStorage.setItem("tutorialShown", "true");
    }

    // Store the aspect ratio (will be set by PoseProcessor)
    this.aspectRatio = 16 / 9; // Default to 16:9 until we get the webcam's aspect ratio
  }

  setAspectRatio(aspectRatio) {
    this.aspectRatio = aspectRatio;
    console.log("UIManager: Aspect ratio set to:", this.aspectRatio);
    this.adjustCanvasHeights(); // Adjust heights immediately when aspect ratio is set
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

    document.getElementById("testSound").addEventListener("click", () => {
      this.playExerciseSound();
    });

    document.getElementById("closeTutorial").addEventListener("click", () => {
      this.tutorialModal.classList.remove("show");
    });

    this.menuToggle.addEventListener("click", () => this.toggleMenu());

    window.addEventListener("load", () => {
      console.log("Window load event: Adjusting canvas heights");
      this.adjustCanvasHeights();
    });
    window.addEventListener("resize", () => {
      console.log("Window resize event: Adjusting canvas heights");
      this.adjustCanvasHeights();
    });

    console.log("Initial call: Adjusting canvas heights");
    this.adjustCanvasHeights();
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

  renderMetrics(metrics = null) {
    if (metrics) {
      this.metricConfig.leftElbowAngle.value = this.formatMetric(
        metrics.leftElbowAngle,
        this.ANGLE_UNIT,
        this.ANGLE_PRECISION
      );
      this.metricConfig.rightElbowAngle.value = this.formatMetric(
        metrics.rightElbowAngle,
        this.ANGLE_UNIT,
        this.ANGLE_PRECISION
      );
      this.metricConfig.avgWristDepth.value = this.formatMetric(
        metrics.avgWristDepth,
        "",
        this.OTHER_METRIC_PRECISION
      );
      this.metricConfig.leftShoulderAngle.value = this.formatMetric(
        metrics.leftShoulderAngle,
        this.ANGLE_UNIT,
        this.ANGLE_PRECISION
      );
      this.metricConfig.rightShoulderAngle.value = this.formatMetric(
        metrics.rightShoulderAngle,
        this.ANGLE_UNIT,
        this.ANGLE_PRECISION
      );
      this.metricConfig.avgHeightDepth.value = this.formatMetric(
        metrics.avgHeightDepth,
        "",
        this.OTHER_METRIC_PRECISION
      );
      this.metricConfig.leftHipAngle.value = this.formatMetric(
        metrics.leftHipAngle,
        this.ANGLE_UNIT,
        this.ANGLE_PRECISION
      );
      this.metricConfig.rightHipAngle.value = this.formatMetric(
        metrics.rightHipAngle,
        this.ANGLE_UNIT,
        this.ANGLE_PRECISION
      );
      this.metricConfig.avgHipAngle.value = this.formatMetric(
        metrics.avgHipAngle,
        this.ANGLE_UNIT,
        this.ANGLE_PRECISION
      );
      this.metricConfig.leftKneeAngle.value = this.formatMetric(
        metrics.leftKneeAngle,
        this.ANGLE_UNIT,
        this.ANGLE_PRECISION
      );
      this.metricConfig.rightKneeAngle.value = this.formatMetric(
        metrics.rightKneeAngle,
        this.ANGLE_UNIT,
        this.ANGLE_PRECISION
      );
    }

    this.dataPoints.innerHTML = `
    <h2>Body Positioning</h2>
    <div class="metrics-grid">
      ${Object.entries(this.metricConfig)
        .map(
          ([key, { label, value, group }]) => `
        <div class="metric-item ${group}">
          <span class="label">${label}</span>
          <span class="value">${value}</span>
        </div>
      `
        )
        .join("")}
    </div>
  `;
  }

  updateActivityLog(string) {
    // TO DO
    return null;
  }

  triggerCelebration() {
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
    const isDarkMode = document.body.dataset.theme === "dark";
    this.sideMenu.querySelector("#menuThemeToggle").checked = isDarkMode;

    this.sideMenu
      .querySelector("#menuThemeToggle")
      .addEventListener("change", (e) => {
        document.body.dataset.theme = e.target.checked ? "dark" : "light";
      });

    this.sideMenu
      .querySelector(".menu-close-btn")
      .addEventListener("click", () => {
        this.toggleMenu();
      });

    this.sideMenu.querySelector("#infoButton").addEventListener("click", () => {
      this.toggleMenu();
      this.infoModal.classList.add("show");
    });

    document.querySelector(".close-modal").addEventListener("click", () => {
      this.infoModal.classList.remove("show");
    });

    this.initDropdown("sideMenuExerciseBtn", "sideMenuExerciseDropdown");
  }

  initStylingControls() {
    const landmarkColor = document.getElementById("landmarkColor");
    const connectionColor = document.getElementById("connectionColor");
    const landmarkRadius = document.getElementById("landmarkRadius");
    const connectionWidth = document.getElementById("connectionWidth");
    const defaultToggle = document.getElementById("defaultToggle");
    const randomizeBtn = document.getElementById("randomizeStyle");

    const defaults = this.drawingUtils.defaultStyles;
    const radiusRange = this.drawingUtils.getLandmarkRadiusRange();
    const widthRange = this.drawingUtils.getConnectionWidthRange();

    landmarkColor.value = defaults.landmarkColor;
    connectionColor.value = defaults.connectionColor;
    landmarkRadius.min = radiusRange.min;
    landmarkRadius.max = radiusRange.max;
    landmarkRadius.value = radiusRange.default;
    connectionWidth.min = widthRange.min;
    connectionWidth.max = widthRange.max;
    connectionWidth.value = widthRange.default;

    const toggleCustomMode = () => {
      defaultToggle.checked = false;
      this.updateStyles();
    };
    landmarkColor.addEventListener("change", toggleCustomMode);
    connectionColor.addEventListener("change", toggleCustomMode);
    landmarkRadius.addEventListener("input", toggleCustomMode);
    connectionWidth.addEventListener("input", toggleCustomMode);

    defaultToggle.addEventListener("change", () => {
      if (defaultToggle.checked) {
        this.lastCustomStyles = {
          landmarkColor: landmarkColor.value,
          connectionColor: connectionColor.value,
          landmarkRadius: parseInt(landmarkRadius.value),
          connectionWidth: parseInt(connectionWidth.value),
        };
        const defaults = this.drawingUtils.defaultStyles;
        landmarkColor.value = defaults.landmarkColor;
        connectionColor.value = defaults.connectionColor;
        landmarkRadius.value = defaults.landmarkRadius;
        connectionWidth.value = defaults.connectionWidth;
      } else if (this.lastCustomStyles) {
        landmarkColor.value = this.lastCustomStyles.landmarkColor;
        connectionColor.value = this.lastCustomStyles.connectionColor;
        landmarkRadius.value = this.lastCustomStyles.landmarkRadius;
        connectionWidth.value = this.lastCustomStyles.connectionWidth;
      }
      this.updateStyles();
    });

    randomizeBtn.addEventListener("click", () => {
      const diceIcon = randomizeBtn.querySelector(".dice-icon");
      diceIcon.style.animation = "";
      diceIcon.offsetWidth;
      diceIcon.style.animation = "shake 0.5s ease-in-out";

      const randomColor = () =>
        `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0")}`;
      landmarkColor.value = randomColor();
      connectionColor.value = randomColor();
      landmarkRadius.value =
        Math.floor(Math.random() * (radiusRange.max - radiusRange.min + 1)) +
        radiusRange.min;
      connectionWidth.value =
        Math.floor(Math.random() * (widthRange.max - widthRange.min + 1)) +
        widthRange.min;
      defaultToggle.checked = false;
      this.updateStyles();
    });
  }

  updateStyles() {
    const landmarkColor = document.getElementById("landmarkColor").value;
    const connectionColor = document.getElementById("connectionColor").value;
    const landmarkRadius = parseInt(
      document.getElementById("landmarkRadius").value
    );
    const connectionWidth = parseInt(
      document.getElementById("connectionWidth").value
    );
    const useDefault = document.getElementById("defaultToggle").checked;

    if (!useDefault) {
      document.getElementById("defaultToggle").checked = false;
    }

    this.drawingUtils.setStyles({
      landmarkColor,
      connectionColor,
      landmarkRadius,
      connectionWidth,
      useDefault,
    });
  }

  toggleMenu() {
    this.menuToggle.classList.toggle("open");
    this.sideMenu.classList.toggle("open");
    this.menuOverlay.classList.toggle("active");

    document.body.style.overflow = this.sideMenu.classList.contains("open")
      ? "hidden"
      : "";

    if (this.sideMenu.classList.contains("open")) {
      document.addEventListener("click", this.handleClickOutside);
    } else {
      document.removeEventListener("click", this.handleClickOutside);
    }
  }

  initializeTheme() {
    const prefersDarkScheme = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    document.body.dataset.theme = prefersDarkScheme ? "dark" : "light";
    return prefersDarkScheme;
  }

  initSoundControls() {
    document.getElementById("soundToggle").addEventListener("change", (e) => {
      this.exerciseManager.isMuted = e.target.checked;
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playExerciseSound() {
    if (this.exerciseManager.isMuted) return;

    const sounds = this.exerciseManager.getCurrentExercise().sounds;
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    new Audio(randomSound).play().catch((e) => console.warn("Sound error:", e));
  }

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

    document.documentElement.style.setProperty(
      "--exercise-primary",
      exercise.color
    );

    if (this.counter) {
      this.counter.textContent = `${exercise.name}: ${exercise.counts || 0}`;
    }

    document.body.dataset.exercise = this.exerciseManager.currentExercise;
  }

  initDropdown(buttonId, menuId) {
    const btn = document.getElementById(buttonId);
    const menu = document.getElementById(menuId);

    if (!btn || !menu) return;

    menu.innerHTML = "";
    Object.entries(this.exerciseManager.exercises).forEach(
      ([key, exercise]) => {
        const button = document.createElement("button");
        button.dataset.exercise = key;
        button.textContent = `${exercise.icon} ${exercise.name}`;
        menu.appendChild(button);
      }
    );

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
      document.dispatchEvent(
        new CustomEvent("exerciseChange", {
          detail: { exerciseType },
        })
      );
      handleOutsideClick();
    };

    btn.addEventListener("click", handleButtonClick);
    document.addEventListener("click", handleOutsideClick);
    menu.querySelectorAll("button").forEach((option) => {
      option.addEventListener("click", handleOptionClick);
    });

    this._dropdownHandlers = this._dropdownHandlers || [];
    this._dropdownHandlers.push({
      btn,
      menu,
      handleButtonClick,
      handleOutsideClick,
      handleOptionClick,
    });
  }

  setDrawingUtils(drawingUtils) {
    this.drawingUtils = drawingUtils;
    this.initStylingControls();
  }

  adjustCanvasHeights() {
    const videoContainer = document.querySelector(".video-container");
    const statsContainer = document.querySelector(".stats-container");
    const container = document.querySelector(".container");
    const videoCanvas = document.querySelector("#videoCanvas");

    if (!videoContainer || !statsContainer || !container || !videoCanvas) {
      console.warn("One or more elements not found for adjusting heights");
      return;
    }

    // Calculate available height (viewport height - header height - padding)
    const availableHeight = window.innerHeight - 70 - 40; // Header height (70px) + container padding (20px top + 20px bottom)

    // Set video container height based on the preferred aspect ratio
    const videoWidth = videoContainer.offsetWidth;
    const videoHeight = videoWidth / this.aspectRatio; // Use the preferred aspect ratio (16:9)
    const finalVideoHeight = Math.min(videoHeight, availableHeight);

    // Set the video container and canvas dimensions
    videoContainer.style.height = `${finalVideoHeight}px`;
    videoCanvas.width = videoWidth;
    videoCanvas.height = finalVideoHeight;

    // Log the dimensions being set
    console.log("Setting canvas dimensions", {
      width: videoWidth,
      height: finalVideoHeight,
      aspectRatio: this.aspectRatio,
    });

    // Set the stats-container height to match the video container height
    statsContainer.style.height = `${finalVideoHeight}px`;

    // Do not override the container's height; let CSS handle it
    // container.style.height = `${finalVideoHeight + 40}px`; // Removed this line
  }

  reset() {
    this.currentCount = 0;
    this.counter.textContent = "Push-Ups: 0";
    this.feedback.textContent = "";
    console.log("Counter reset to 0");
  }
}
