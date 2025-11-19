/**
 * jspsych-canvas-keyboard-response
 * Chris Jungerius (modified from Josh de Leeuw)
 *
 * a jsPsych plugin for displaying a canvas stimulus and getting a keyboard response
 *
 * documentation: docs.jspsych.org
 *
 **/


var dmPsychHoverBall = (function (jspsych) {
  'use strict';

  const info = {
    name: 'hole-in-one-game',
    description: '',
    parameters: {
      // The drawing function to apply to the canvas. Should take the canvas object as argument
      stimulus: {
        type: jspsych.ParameterType.FUNCTION,
        pretty_name: 'Stimulus',
        default: undefined,
      },
      // Any content here will be displayed below the stimulus
      prompt: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
      },
      // Number of shots before the game ends
      total_shots: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Number of shots',
        default: null,
      },
      // How long to show trial before it ends
      trial_duration: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
      },
      // Array containing the height (first value) and width (second value) of the canvas element
      canvas_size: {
        type: jspsych.ParameterType.INT,
        array: true,
        pretty_name: 'Canvas size',
        default: [500, 500],
      },
      // Color of the ball in the slingshot game
      ball_color: {
        type: jspsych.ParameterType.STRING,
        pretty_name: 'Color of the ball',
        default: 'blue',
      },
      // Ball position on x axis in terms of percent from left
      ball_xPos: {
        type: jspsych.ParameterType.FLOAT,
        pretty_name: 'Ball position on x axis',
        default: .15,
      },
      // Ball position on y axis in terms of percent from top
      ball_yPos: {
        type: jspsych.ParameterType.FLOAT,
        pretty_name: 'Ball position on y axis',
        default: .5,
      },
      // Radius of the ball in pixels
      ball_size: {
        type: jspsych.ParameterType.INT,
        pretty_name: 'Size of the ball',
        default: 16,
      },
      // gravity
      gravity: {
        type: jspsych.ParameterType.FLOAT,
        pretty_name: 'gravity',
        default: .5,
      },
      // target force
      target_force: {
        type: jspsych.ParameterType.FLOAT,
        pretty_name: 'force applied to ball at center of screen',
        default: .5,
      },
      // slope
      slope: {
        type: jspsych.ParameterType.FLOAT,
        pretty_name: 'change in force from bottom to middle of screen',
        default: 2,
      },
      // target size
      target_size: {
        type: jspsych.ParameterType.FLOAT,
        pretty_name: 'size of target',
        default: 50,
      },
      /** If true, the subject can use keyboard keys to navigate the pages. */
      allow_keys: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: "Allow keys",
        default: false,
      },
    },
  };

  class HoverBallPlugin {
    constructor(jsPsych) {
        this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {

      var new_html = '<div id="jspsych-canvas-keyboard-response-stimulus">' + '<canvas id="jspsych-canvas-stimulus" height="' + trial.canvas_size[0] + '" width="' + trial.canvas_size[1] + '"></canvas>' + '</div>';
      
      // add prompt
      if (trial.prompt !== null) {
        new_html = trial.prompt + new_html;
      }

      // draw
      display_element.innerHTML = new_html;
      let c = document.getElementById("jspsych-canvas-stimulus");
      let req;

      let trial_data = {
        nPress: 0,
      };

      trial.stimulus(c, trial, trial_data);

      // function to end trial when it is time
      const endTrial = () => {

        // kill any remaining setTimeout handlers
        this.jsPsych.pluginAPI.clearAllTimeouts();

        // stop listening for last trial
        cancelAnimationFrame(req);

        // kill keyboard listeners
        if (trial.allow_keys) {
            this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboard_listener);
        }

        // gather the data to store for the trial
        console.log(trial_data)

        // clear the display
        display_element.innerHTML = '';

        // move on to the next trial
        this.jsPsych.finishTrial(trial_data);
      };

      // end trial if trial_duration is set
      if (trial.trial_duration !== null) {
        jsPsych.pluginAPI.setTimeout(function () {
          endTrial();
        }, trial.trial_duration);
      }
    };
  };

  HoverBallPlugin.info = info;

  return HoverBallPlugin;

})(jsPsychModule);

var dmPsychBouncingBalls = (function (jspsych) {
  'use strict';

  const info = {
    name: 'bouncing-balls',
    description: 'Three bouncing balls moving around the screen with a spinning loader and animated Loading text',
    parameters: {
      trial_duration: { type: jspsych.ParameterType.INT, default: 60000 },
    },
  };

  class BouncingBallsPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      // Create full-screen canvas container with white background
      let new_html = `
        <div id="jspsych-canvas-container" style="position: fixed; width: 100vw; height: 100vh; background: white; top: 0; left: 0;">
          <canvas id="jspsych-canvas-stimulus"></canvas>
          
          <!-- Spinning Loader -->
          <div id="loading-spinner" style="
              position: fixed; 
              left: 50%;
              top: 50%;
              width: 60px;
              height: 60px;
              border: 5px solid rgba(0, 0, 0, 0.2);
              border-top: 5px solid black;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              transform: translate(-50%, -50%);
          "></div>

          <!-- Pulsating "Loading..." Text -->
          <div id="loading-text" style="
              position: fixed; 
              left: 50%; 
              top: 58%;
              transform: translate(-50%, -50%);
              color: black; 
              font-size: 24px; 
              font-family: Arial, sans-serif; 
              font-weight: bold; 
              text-align: center;
              animation: pulse 1s infinite alternate;
          ">
            Loading...
          </div>
        </div>

        <!-- CSS Keyframe Animations -->
        <style>
          @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }

          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
            100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
          }
        </style>
      `;

      // Insert into jsPsych trial
      display_element.innerHTML = new_html;
      let canvas = document.getElementById("jspsych-canvas-stimulus");
      let ctx = canvas.getContext("2d");

      // Resize canvas dynamically
      function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      window.addEventListener("resize", resizeCanvas);
      resizeCanvas(); // Set initial size
      
      let req;  // Define the requestAnimationFrame variable

      function animateBalls() {
        req = requestAnimationFrame(animateBalls);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Ball animation logic here...
      }
      animateBalls();  // Start animation
      
      
      // End the trial after the given duration
      this.jsPsych.pluginAPI.setTimeout(() => {
        cancelAnimationFrame(req);
        display_element.innerHTML = ''; // Clear display
        this.jsPsych.finishTrial(); // Move to next trial
      }, trial.trial_duration);
    }
  }

  BouncingBallsPlugin.info = info;

  return BouncingBallsPlugin;

})(jsPsychModule);
