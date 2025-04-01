// Module implements push-up detection logic.

import { ExerciseDetector } from "./exerciseDetector.js";

export class PushUpDetector extends ExerciseDetector {
  constructor(onExerciseDetected, onFeedback, config) {
    super(onExerciseDetected, onFeedback, config);
    this.conditions = config.conditions;
  }

  processPose(landmarks, metrics) {
    // 1. Update movement tracking
    const elbowAngle = metrics.angles.elbow.average;
    this.updateVelocity(elbowAngle);

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
        if (elbowAngle > 160) this.transitionTo("READY");
        break;

      case "READY":
        if (this.isDescending && elbowAngle < 155) this.transitionTo("DOWN");
        break;

      case "DOWN":
        this.updateMinAngles(metrics);

        if (this.isAscending) {
          if (elbowAngle <= 100) {
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
        if (elbowAngle >= 160) {
          this.logCompletedRep();
          this.transitionTo("READY");
        } else if (this.isDescending) {
          // Cancel rep if descending before completion
          this.transitionTo("DOWN");
        }
        break;

      case "PARTIAL":
        if (elbowAngle >= 160) {
          this.transitionTo("READY");
        } else if (this.isDescending && elbowAngle < 100) {
          this.transitionTo("DOWN");
        }
        break;
    }
  }

  isInPushUpPosition(metrics) {
    console.log("metrics", metrics);
    console.log("hip angle", metrics.angles.hip.average);
    const hipAngle = metrics.angles.hip.average;
    const wristDepth = metrics.depths.wrist.average;
    return (
      hipAngle >= this.conditions.hipAngle.min &&
      hipAngle <= this.conditions.hipAngle.max &&
      wristDepth <= this.conditions.wristDepth.max
      // TODO back height < this.conditions.heightDiffMax
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
