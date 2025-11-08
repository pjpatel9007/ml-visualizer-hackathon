import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

function App() {
  const [isRunning, setIsRunning] = useState(false)
  const [data, setData] = useState([])

  const handleRunModel = () => {
    setIsRunning(true)
    // TODO: Start Web Worker and run WASM model
    console.log('Run Model button clicked')
    // Placeholder: simulate adding data
    setTimeout(() => {
      setData([{ epoch: 1, loss: 9.8 }])
      setIsRunning(false)
    }, 1000)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Real-Time ML Visualizer</h1>
        <p>Gradient Descent Training Visualization</p>
      </header>

      <div className="controls">
        <button 
          onClick={handleRunModel} 
          disabled={isRunning}
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
