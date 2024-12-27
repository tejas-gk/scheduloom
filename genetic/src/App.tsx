import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import TimetableGenerator from './components/TimetableGenerator'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <TimetableGenerator/>
  )
}

export default App
