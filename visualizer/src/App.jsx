import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Scatter } from 'recharts'
import './App.css'

function App() {
  const [isLoading, setIsLoading] = useState(true) // For the initial Wasm module load
  const [isRunning, setIsRunning] = useState(false) // For when the model is computing
  const [error, setError] = useState(null) // For any errors
  const [trainingData, setTrainingData] = useState([])
  const [workerStatus, setWorkerStatus] = useState('Initializing...')
  const [learningRate, setLearningRate] = useState(0.01)
  const [currentEpoch, setCurrentEpoch] = useState(0)
  const [currentParams, setCurrentParams] = useState({ m: null, b: null, loss: null })
  const workerRef = useRef(null)

  // Hard-coded "Monopoly" dataset
  const monopolyData = [
    { x: 0, y: 10 },
    { x: 1, y: 50 },
    { x: 2, y: 150 },
    { x: 3, y: 450 },
    { x: 4, y: 625 },
  ]

  useEffect(() => {
    // Create the Web Worker instance
    const worker = new Worker('/compute.worker.js')
    workerRef.current = worker

    // Set up message listener to receive messages from the worker
    worker.onmessage = (event) => {
      const { type, payload } = event.data
      console.log('[Main] Received message from worker:', type, payload)

      switch (type) {
        case 'MODULE_LOADING':
          setIsLoading(true)
          setWorkerStatus('Loading WASM module...')
          console.log('[Main] WASM module is loading')
          break

        case 'MODULE_LOADED':
          setIsLoading(false)
          setWorkerStatus('Ready')
          setError(null)
          console.log('[Main] WASM module loaded and ready')
          break

        case 'MODULE_ERROR':
          setIsLoading(false)
          setWorkerStatus('Error')
          setError('Module load error: ' + payload.error)
          console.error('[Main] Module error:', payload.error)
          break

        case 'TRAINING_STARTED':
          setIsRunning(true)
          console.log('[Main] Training started with learning_rate:', payload.learning_rate)
          setTrainingData([]) // Clear previous data
          setCurrentEpoch(0)
          setCurrentParams({ m: null, b: null, loss: null })
          setError(null)
          break

        case 'STREAM_DATA':
          // Real-time streaming data from C++ gradient descent
          // Format: { epoch, m, b, loss }
          console.log('[Main] Stream data received:', payload)
          setCurrentEpoch(payload.epoch)
          setCurrentParams({ m: payload.m, b: payload.b, loss: payload.loss })
          
          // Add to training data array for visualization
          setTrainingData(prevData => [...prevData, payload])
          break

        case 'MODEL_COMPLETE':
          setIsRunning(false)
          console.log('[Main] Model training completed successfully')
          break

        case 'TRAINING_COMPLETE':
          setIsRunning(false)
          console.log('[Main] Training completed successfully')
          break

        case 'MODEL_ERROR':
          setIsRunning(false)
          setError('Model error: ' + payload.error)
          console.error('[Main] Model error:', payload.error)
          break

        case 'TRAINING_ERROR':
          setIsRunning(false)
          setError('Training error: ' + payload.error)
          console.error('[Main] Training error:', payload.error)
          break

        case 'STREAM_ERROR':
          setError('Stream error: ' + payload.error)
          console.error('[Main] Stream error:', payload.error)
          break

        default:
          console.warn('[Main] Unknown message type:', type)
          break
      }
    }

    // Handle worker errors
    worker.onerror = (error) => {
      console.error('[Main] Worker error:', error)
      setWorkerStatus('Worker Error')
      setIsRunning(false)
      setIsLoading(false)
      setError('Worker failed to load')
    }

    // Cleanup: terminate worker when component unmounts
    return () => {
      console.log('[Main] Terminating worker')
      worker.terminate()
    }
  }, [])

  const handleRunModel = () => {
    if (isLoading) {
      console.warn('[Main] Worker is still loading')
      return
    }
    
    if (error) {
      console.warn('[Main] Cannot run model - error state:', error)
      return
    }
    
    if (workerRef.current && workerStatus === 'Ready' && !isRunning) {
      console.log('[Main] Sending RUN_GRADIENT_DESCENT message to worker')
      
      // Send message to worker to run gradient descent
      workerRef.current.postMessage({
        type: 'RUN_GRADIENT_DESCENT',
        payload: { learning_rate: learningRate }
      })
    } else {
      console.warn('[Main] Worker not ready. Status:', workerStatus, 'isRunning:', isRunning)
    }
  }

  // Derive the fitted line data from current parameters (m, b)
  // This creates a 2-point line that animates as m and b update
  const fittedLineData = currentParams.m !== null && currentParams.b !== null
    ? [
        { x: 0, y: currentParams.b }, // y = m*0 + b = b
        { x: 4, y: currentParams.m * 4 + currentParams.b } // y = m*4 + b
      ]
    : []

  return (
    <div className="App">
      <header className="App-header">
        <h1>Real-Time ML Visualizer</h1>
        <p>Gradient Descent Training Visualization</p>
      </header>

      <div className="status-bar">
        <span className="status-label">Worker Status:</span>
        <span className={`status-value ${workerStatus === 'Ready' ? 'ready' : ''} ${error ? 'error' : ''}`}>
          {isLoading ? '⏳ Loading...' : workerStatus}
        </span>
        {currentEpoch > 0 && !error && (
          <span className="result-display">
            Epoch: {currentEpoch} | m: {currentParams.m?.toFixed(4)} | b: {currentParams.b?.toFixed(4)} | Loss: {currentParams.loss?.toFixed(4)}
          </span>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="controls">
        <div className="control-group">
          <label htmlFor="learning-rate">Learning Rate:</label>
          <input
            id="learning-rate"
            type="number"
            step="0.001"
            min="0.001"
            max="1"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            disabled={isRunning || isLoading}
            className="input-field"
          />
        </div>
        <button 
          onClick={handleRunModel} 
          disabled={isRunning || isLoading || workerStatus !== 'Ready' || error !== null}
          className="run-button"
          title={isLoading ? 'Loading module...' : error ? 'Error occurred' : isRunning ? 'Training in progress...' : 'Click to start training'}
        >
          {isLoading ? '⏳ Loading...' : isRunning ? '🔄 Training...' : 'Run Model'}
        </button>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Model Fit Visualization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monopolyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="X" 
                domain={[0, 4]}
                label={{ value: 'X', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                domain={[0, 700]}
                label={{ value: 'Y', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip />
              <Legend />
              <Scatter 
                name="Actual Data" 
                dataKey="y" 
                fill="#8884d8" 
              />
              {fittedLineData.length > 0 && (
                <Line 
                  name="Fitted Line" 
                  data={fittedLineData} 
                  dataKey="y" 
                  stroke="#e63946" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h3>Model Loss (Mean Squared Error)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trainingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="epoch" 
                name="Epoch" 
                allowDuplicatedCategory={false}
                label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                dataKey="loss" 
                name="Loss (MSE)"
                label={{ value: 'Loss (MSE)', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip />
              <Line 
                name="Loss" 
                dataKey="loss" 
                stroke="#e63946" 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default App
