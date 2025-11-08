import React, { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

function App() {
  const [isRunning, setIsRunning] = useState(false)
  const [data, setData] = useState([])
  const [workerStatus, setWorkerStatus] = useState('Initializing...')
  const [lastResult, setLastResult] = useState(null)
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

        case 'ADD_RESULT':
          setLastResult(payload)
          setIsRunning(false)
          console.log('[Main] ADD result:', payload)
          // Add a data point to visualize the result
          setData(prevData => [...prevData, { 
            epoch: prevData.length + 1, 
            loss: payload 
          }])
          break

        case 'ADD_ERROR':
          setWorkerStatus('Error: ' + payload.error)
          setIsRunning(false)
          console.error('[Main] ADD error:', payload.error)
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
      console.log('[Main] Sending RUN_ADD message to worker')
      
      // Send a test message to the worker to call the add function
      workerRef.current.postMessage({
        type: 'RUN_ADD',
        payload: { a: 2, b: 2 }
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
        {lastResult !== null && (
          <span className="result-display">
            Last Result: 2 + 2 = {lastResult}
          </span>
        )}
      </div>

      <div className="controls">
        <button 
          onClick={handleRunModel} 
          disabled={isRunning || workerStatus !== 'Ready'}
          className="run-button"
        >
          {isRunning ? 'Running...' : 'Run Model'}
        </button>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Training Loss</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="loss" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default App
