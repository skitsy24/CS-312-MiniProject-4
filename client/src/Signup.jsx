import { useState } from 'react'
import { sendJson } from './api'

export default function Signup() {
  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    try {
      const result = await sendJson('/api/signup', { user_id: userId, name, password })
      setMessage(result.message)
      setPassword('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="post-form" aria-labelledby="signup-heading">
      <h2 id="signup-heading">Sign Up</h2>
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {message && <p className="alert alert-success" role="status">{message} <a href="/signin">Sign in</a>.</p>}

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
          <label className="form-label" htmlFor="name">Name</label>
          <input
            className="form-control"
            id="name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
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
            autoComplete="new-password"
            required
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </section>
  )
}
