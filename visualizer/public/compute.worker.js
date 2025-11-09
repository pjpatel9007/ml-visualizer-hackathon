// compute.worker.js - Web Worker for running C++/WASM code
// This worker loads the Emscripten-compiled module and runs computations
// without blocking the main UI thread

// Send MODULE_LOADING message immediately
self.postMessage({ type: 'MODULE_LOADING' });

let addFunction = null;
let runGradientDescentFunction = null;

// Define the global stream_data function that C++ will call
// This will be called ~200 times during gradient descent training
self.stream_data = function(jsonString) {
  try {
    // Parse the JSON string from C++
    const data = JSON.parse(jsonString);
    console.log('[Worker] Streaming data:', data);
    
    // Check for completion signal
    if (data.epoch === 'complete') {
      // Send MODEL_COMPLETE instead of STREAM_DATA
      self.postMessage({
        type: 'MODEL_COMPLETE',
        payload: { success: true }
      });
      return;
    }
    
    // Send the streaming data back to the main thread
    self.postMessage({
      type: 'STREAM_DATA',
      payload: data
    });
  } catch (error) {
    console.error('[Worker] Error parsing stream data:', error);
    self.postMessage({
      type: 'STREAM_ERROR',
      payload: { error: error.message }
    });
  }
};

// Load the Emscripten glue script
importScripts('/compute.js');

// The Module object is now available from compute.js as a global
// Wait for it to be defined and then set up the callback
(function setupModule() {
  if (typeof Module === 'undefined') {
    // Module not available yet, try again
    setTimeout(setupModule, 10);
    return;
  }
  
  const originalCallback = Module.onRuntimeInitialized || function() {};
  
  Module.onRuntimeInitialized = function() {
    // Call the original callback first
    originalCallback();
    
    console.log('[Worker] WASM Runtime Initialized');
    console.log('[Worker] Module.cwrap exists?', typeof Module.cwrap);
    console.log('[Worker] Module keys:', Object.keys(Module).slice(0, 20));
    
    // Wrap the C++ functions for JavaScript use
    // cwrap signature: cwrap(name, returnType, argTypes)
    try {
      // Test function (for Step 2 validation)
      addFunction = Module.cwrap('add', 'number', ['number', 'number']);
      console.log('[Worker] add function wrapped successfully');
      
      // Real gradient descent function (for Step 3)
      // This function takes learning_rate and will call stream_data() repeatedly
      runGradientDescentFunction = Module.cwrap('run_gradient_descent', null, ['number']);
      console.log('[Worker] run_gradient_descent function wrapped successfully', runGradientDescentFunction);
      console.log('[Worker] Checking variable status:', 'addFunction=', addFunction, 'runGradientDescentFunction=', runGradientDescentFunction);
      
      // Notify the main thread that the module is loaded and ready
      self.postMessage({
        type: 'MODULE_LOADED',
        payload: { ready: true }
      });
    } catch (error) {
      console.error('[Worker] Failed to wrap functions:', error);
      self.postMessage({
        type: 'MODULE_ERROR',
        payload: { error: error.message }
      });
    }
  };
})();

// Listen for messages from the main thread
self.onmessage = function(event) {
  const { type, payload } = event.data;
  
  console.log('[Worker] Received message:', type, payload);
  console.log('[Worker] Global scope check - addFunction:', typeof addFunction, 'runGradientDescentFunction:', typeof runGradientDescentFunction);
  
  switch (type) {
    case 'RUN_ADD':
      // Call the WASM add function (test function from Step 2)
      if (addFunction) {
        try {
          const result = addFunction(payload.a, payload.b);
          console.log(`[Worker] add(${payload.a}, ${payload.b}) = ${result}`);
          
          // Send the result back to the main thread
          self.postMessage({
            type: 'ADD_RESULT',
            payload: result
          });
        } catch (error) {
          console.error('[Worker] Error calling add function:', error);
          self.postMessage({
            type: 'ADD_ERROR',
            payload: { error: error.message }
          });
        }
      } else {
        console.error('[Worker] add function not initialized');
        self.postMessage({
          type: 'ADD_ERROR',
          payload: { error: 'Function not initialized' }
        });
      }
      break;
      
    case 'RUN_GRADIENT_DESCENT':
      // Call the WASM gradient descent function
      console.log('[Worker] runGradientDescentFunction status:', runGradientDescentFunction, 'type:', typeof runGradientDescentFunction);
      if (runGradientDescentFunction) {
        try {
          const learningRate = payload.learning_rate;
          console.log(`[Worker] Starting gradient descent with learning_rate=${learningRate}`);
          
          // Notify the main thread that training has started
          self.postMessage({
            type: 'TRAINING_STARTED',
            payload: { learning_rate: learningRate }
          });
          
          // Call the C++ function - it will call stream_data() repeatedly
          // Wrap in try-catch to handle any errors during execution
          try {
            runGradientDescentFunction(learningRate);
          } catch (e) {
            console.error('[Worker] Error during gradient descent execution:', e);
            self.postMessage({
              type: 'MODEL_ERROR',
              payload: { error: e.message }
            });
            return;
          }
          
          console.log('[Worker] Gradient descent completed');
        } catch (error) {
          console.error('[Worker] Error calling run_gradient_descent:', error);
          self.postMessage({
            type: 'MODEL_ERROR',
            payload: { error: error.message }
          });
        }
      } else {
        console.error('[Worker] run_gradient_descent function not initialized');
        self.postMessage({
          type: 'MODEL_ERROR',
          payload: { error: 'Function not initialized' }
        });
      }
      break;
      
    default:
      console.warn('[Worker] Unknown message type:', type);
      break;
  }
};

console.log('[Worker] compute.worker.js loaded, waiting for WASM initialization...');
