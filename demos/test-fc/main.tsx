import { useState } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [num] = useState(123)
  return <span>{num}</span>
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
)
