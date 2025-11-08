import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

function App() {
  const [isRunning, setIsRunning] = useState(false)
  const [trainingData, setTrainingData] = useState([])
  const [workerStatus, setWorkerStatus] = useState('Initializing...')
  const [learningRate, setLearningRate] = useState(0.01)
  const [currentEpoch, setCurrentEpoch] = useState(0)
  const [currentParams, setCurrentParams] = useState({ m: null, b: null, loss: null })
  const workerRef = useRef(null)

  useEffect(() => {
    // Create the Web Worker instance
    const worker = new Worker('/compute.worker.js')
    workerRef.current = worker

    // Set up message listener to receive messages from the worker
    worker.onmessage = (event) => {
      const { type, payload } = event.data
      console.log('[Main] Received message from worker:', type, payload)

      switch (type) {
        case 'MODULE_LOADED':
          setWorkerStatus('Ready')
          console.log('[Main] WASM module loaded and ready')
          break

        case 'MODULE_ERROR':
          setWorkerStatus('Error: ' + payload.error)
          console.error('[Main] Module error:', payload.error)
          break

        case 'TRAINING_STARTED':
          console.log('[Main] Training started with learning_rate:', payload.learning_rate)
          setTrainingData([]) // Clear previous data
          setCurrentEpoch(0)
          setCurrentParams({ m: null, b: null, loss: null })
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

        case 'TRAINING_COMPLETE':
          setIsRunning(false)
          console.log('[Main] Training completed successfully')
          break

        case 'TRAINING_ERROR':
          setWorkerStatus('Error: ' + payload.error)
          setIsRunning(false)
          console.error('[Main] Training error:', payload.error)
          break

        case 'STREAM_ERROR':
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
    }

    // Cleanup: terminate worker when component unmounts
    return () => {
      console.log('[Main] Terminating worker')
      worker.terminate()
    }
  }, [])

  const handleRunModel = () => {
    if (workerRef.current && workerStatus === 'Ready') {
      setIsRunning(true)
      console.log('[Main] Sending RUN_GRADIENT_DESCENT message to worker')
      
      // Send message to worker to run gradient descent
      workerRef.current.postMessage({
        type: 'RUN_GRADIENT_DESCENT',
        payload: { learning_rate: learningRate }
      })
    } else {
      console.warn('[Main] Worker not ready. Status:', workerStatus)
      alert('Worker not ready yet. Please wait...')
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Real-Time ML Visualizer</h1>
        <p>Gradient Descent Training Visualization</p>
      </header>

      <div className="status-bar">
        <span className="status-label">Worker Status:</span>
        <span className={`status-value ${workerStatus === 'Ready' ? 'ready' : ''}`}>
          {workerStatus}
        </span>
        {currentEpoch > 0 && (
          <span className="result-display">
            Epoch: {currentEpoch} | m: {currentParams.m?.toFixed(4)} | b: {currentParams.b?.toFixed(4)} | Loss: {currentParams.loss?.toFixed(4)}
          </span>
        )}
      </div>

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
            disabled={isRunning}
            className="input-field"
          />
        </div>
        <button 
          onClick={handleRunModel} 
          disabled={isRunning || workerStatus !== 'Ready'}
          className="run-button"
        >
          {isRunning ? 'Training...' : 'Run Model'}
        </button>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Training Loss</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trainingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="loss" stroke="#8884d8" activeDot={{ r: 8 }} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h3>Model Parameters (m & b)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trainingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="m" stroke="#82ca9d" name="m (slope)" activeDot={{ r: 8 }} dot={false} />
              <Line type="monotone" dataKey="b" stroke="#ffc658" name="b (intercept)" activeDot={{ r: 8 }} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default App
