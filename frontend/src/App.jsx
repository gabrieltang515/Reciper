import { useEffect, useState } from 'react'

function App() {
  const [msg, setMsg] = useState('Loading…')

  useEffect(() => {
    fetch('/api/hello')               // ← your Express route
      .then(res => res.json())
      .then(data => setMsg(data.msg)) // assuming your backend returns { msg: '…' }
      .catch(() => setMsg('Error'))
  }, [])

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Recipe Scraper</h1>
      <p>Backend says: <strong>{msg}</strong></p>
    </main>
  )
}

export default App
