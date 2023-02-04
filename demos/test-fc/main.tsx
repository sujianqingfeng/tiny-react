import { useState } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [num, setNum] = useState(123)
  window.setNum = setNum
  return num > 3 ? (<div>{num}</div>) : 'hahah'
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
)
