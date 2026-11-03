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
      {error && <p className="alert alert-danger" role="alert">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label" htmlFor="user_id">User ID</label>
          <input
            className="form-control"
            id="user_id"
            name="user_id"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label" htmlFor="password">Password</label>
          <input
            className="form-control"
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </section>
  )
}
