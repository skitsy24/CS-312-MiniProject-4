import { useState } from 'react'
import { sendJson } from './api'

export default function Signin() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await sendJson('/api/signin', { user_id: userId, password })
      window.location.assign('/')
    } catch (requestError) {
      setError(requestError.message)
      setBusy(false)
    }
  }

  return (
    <section className="post-form" aria-labelledby="signin-heading">
      <h2 id="signin-heading">Sign In</h2>
      {error && <p className="alert" role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label className="form-label">
          User ID
          <input
            className="form-control"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="form-label">
          Password
          <input
            className="form-control"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button className="button" type="submit" disabled={busy}>
          {busy ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      <p className="form-footer">Need an account? <a href="/signup">Sign up</a>.</p>
    </section>
  )
}
