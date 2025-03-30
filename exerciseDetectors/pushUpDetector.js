// Module implements push-up detection logic.

import { ExerciseDetector } from "./exerciseDetector.js";

export class PushUpDetector extends ExerciseDetector {
  constructor(onExerciseDetected, onFeedback, config) {
    super(onExerciseDetected, onFeedback, config);
    this.DELTA_DEG_PER_FRAME = 0.3;
    this.VEL_BUFFER_SIZE = 5;
  }

  processPose(landmarks, metrics) {
    // 1. Update movement tracking
    const { avgElbowAngle } = metrics;
    this.updateVelocity(avgElbowAngle);

    // 2. Visibility & push-up position check
    if (!this.validatePose(landmarks)) {
      this.transitionTo("NOT_VISIBLE");
      return;
    }

    if (!this.isInPushUpPosition(metrics)) {
      this.transitionTo("NOT_READY");
      return;
    }

    // 3. State machine
    switch (this.state) {
      case "NOT_VISIBLE":
        this.transitionTo("NOT_READY");
        break;

      case "NOT_READY":
        if (metrics.avgElbowAngle > 160) {
          this.transitionTo("READY");
        }
        break;

      case "READY":
        if (this.isDescending && avgElbowAngle < 155) {
          this.transitionTo("DOWN");
        }
        break;

      case "DOWN":
        if (this.isAscending) {
          if (metrics.avgElbowAngle <= 100) {
            this.transitionTo("UP");
          } else {
            // didn't go deep enough
            // TODO TEST THIS
            console.log("Impartial rep - didn't go deep enough");
            this.transitionTo("PARTIAL");
          }
        }
        break;

      case "UP":
        if (metrics.avgElbowAngle >= 160) {
          this.stats.valid++;
          this.onExerciseDetected({
            count: this.stats.valid,
            downDuration: this.getPhaseDuration("DOWN"),
            upDuration: this.getPhaseDuration("UP"),
          });
          this.transitionTo("READY");
        } else if (this.isDescending) {
          // Cancel rep if descending before completion
          this.transitionTo("DOWN");
        }
        break;

      case "PARTIAL":
        if (avgElbowAngle >= 160) {
          this.transitionTo("READY");
        } else if (this.isDescending && avgElbowAngle < 100) {
          this.transitionTo("DOWN");
        }
        break;
    }
  }

  // Tracking change in angle
  updateVelocity(currentAngle) {
    if (this.prevAngle !== null) {
      this.velocityBuffer.push(currentAngle - this.prevAngle);
      if (this.velocityBuffer.length > 5) this.velocityBuffer.shift();
    }
    this.prevAngle = currentAngle;
  }

  // Track downard push-up movement
  get isDescending() {
    return (
      this.velocityBuffer.length >= this.VEL_BUFFER_SIZE &&
      this.velocityBuffer.every((v) => v < -this.DELTA_DEG_PER_FRAME)
    );
  }

  get isAscending() {
    return (
      this.velocityBuffer.length >= this.VEL_BUFFER_SIZE &&
      this.velocityBuffer.every((v) => v > this.DELTA_DEG_PER_FRAME)
    );
  }

  isInPushUpPosition(metrics) {
    return (
      metrics.avgBackAngle >= 150 &&
      metrics.avgBackAngle <= 210 &&
      metrics.avgWristDepth <= 0.13
      // TODO back height

      // isInPushUpPosition(metrics) {
      //   const readyConfig = this.config.phases.READY.entryConditions;
      //   return (
      //     metrics.avgElbowAngle >= readyConfig.elbowAngle.min &&
      //     metrics.avgElbowAngle <= readyConfig.elbowAngle.max &&
      //     metrics.avgWristDepth <= readyConfig.wristDepth.max &&
      //     metrics.avgBackAngle >= readyConfig.backAngle.min &&
      //     metrics.avgBackAngle <= readyConfig.backAngle.max
      //   );
      // }
    );
  }
}

//     // 1. Visibility & push-up position check
//     if (!this.validatePose(landmarks)) {
//       if (this.shouldTransition("NOT_VISIBLE")) {
//         this.transitionTo("NOT_VISIBLE");
//       }
//       return;
//     }
//     if (!this.isInPushUpPosition(metrics)) {
//       if (this.shouldTransition("NOT_READY")) {
//         this.transitionTo("NOT_READY");
//       }
//       return;
//     }

//     // 3. Update frame counters
//     this.frameCounters[this.state]++;

//     // 4. State machine logic

//     // TODO PROBLEM, NEED TO TRACK DELTA, IE CHANGE IN ELBOW ANGLE, OTHERWISE HOW CAN WE TELL IF DOWN OR UP
//     switch (this.state) {
//       case "NOT_VISIBLE":
//         if (this.shouldTransition("NOT_READY")) {
//           this.transitionTo("NOT_READY");
//         }
//         break;

//       case "NOT_READY":
//         if (this.isInPushUpPosition(metrics)) {
//           if (this.shouldTransition("READY")) {
//             this.transitionTo("READY");
//           }
//         }
//         break;

//       case "READY":
//         if (avgElbowAngle < entryConditions.elbowAngleTop.exit) {
//           if (this.shouldTransition("DOWN")) {
//             this.transitionTo("DOWN");
//           }
//         }
//         break;

//       case "DOWN":
//         if (avgElbowAngle <= entryConditions.elbowAngleBottom.enter) {
//           if (this.shouldTransition("BOTTOM")) {
//             this.transitionTo("BOTTOM");
//           }
//         } else if (avgElbowAngle >= entryConditions.elbowAngleTop.exit) {
//           if (this.shouldTransition("READY")) {
//             this.transitionTo("READY");
//           }
//         }
//         break;

//       case "BOTTOM":
//         if (avgElbowAngle >= entryConditions.elbowAngleBottom.exit) {
//           if (this.shouldTransition("UP")) {
//             this.transitionTo("UP");
//           }
//         }
//         break;

//       case "UP":
//         if (avgElbowAngle > entryConditions.elbowAngleTop.enter) {
//           if (this.shouldTransition("READY")) {
//             this.stats.valid++;
//             this.stats.total++;
//             this.onExerciseDetected({
//               count: this.stats.valid,
//               downDuration: this.phaseTimers.DOWN.duration,
//               upDuration: this.phaseTimers.UP.duration,
//             });
//             this.transitionTo("READY");
//           }
//         } else if (
//           //
//           true
//         ) {
//           if (this.shouldTransition("DOWN")) {
//             this.transitionTo("DOWN");
//           }
//         }
//         break;
//     }
//   }
// }
