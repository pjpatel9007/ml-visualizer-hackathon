// compute.worker.js - Web Worker for running C++/WASM code
// This worker loads the Emscripten-compiled module and runs computations
// without blocking the main UI thread

let addFunction = null;

// Load the Emscripten glue script
importScripts('/compute.js');

// The Module object is now available from compute.js
// Override the onRuntimeInitialized callback to initialize our worker
if (typeof Module !== 'undefined') {
  const originalCallback = Module.onRuntimeInitialized || function() {};
  
  Module.onRuntimeInitialized = function() {
    // Call the original callback first
    originalCallback();
    
    console.log('[Worker] WASM Runtime Initialized');
    
    // Wrap the C++ 'add' function for JavaScript use
    // cwrap signature: cwrap(name, returnType, argTypes)
    try {
      addFunction = Module.cwrap('add', 'number', ['number', 'number']);
      console.log('[Worker] add function wrapped successfully');
      
      // Notify the main thread that the module is loaded and ready
      self.postMessage({
        type: 'MODULE_LOADED',
        payload: { ready: true }
      });
    } catch (error) {
      console.error('[Worker] Failed to wrap add function:', error);
      self.postMessage({
        type: 'MODULE_ERROR',
        payload: { error: error.message }
      });
    }
  };
}

// Listen for messages from the main thread
self.onmessage = function(event) {
  const { type, payload } = event.data;
  
  console.log('[Worker] Received message:', type, payload);
  
  switch (type) {
    case 'RUN_ADD':
      // Call the WASM add function
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
      
    default:
      console.warn('[Worker] Unknown message type:', type);
      break;
  }
};

console.log('[Worker] compute.worker.js loaded, waiting for WASM initialization...');
