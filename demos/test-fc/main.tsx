import { useState, useEffect } from 'react'
import ReactDOM from 'react-noop-renderer'

function App() {
  return (
    <>
      <Child/>
      <div>hi react</div>
    </>
  )
}

function Child() {
  return 'child'
}

const root = ReactDOM.createRoot()
window.root = root
root.render(
  <App />
)
