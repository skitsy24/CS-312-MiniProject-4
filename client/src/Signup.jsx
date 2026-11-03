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
      {error && <p className="alert" role="alert">{error}</p>}
      {message && <p className="notice" role="status">{message} <a href="/signin">Sign in</a>.</p>}

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
          Name
          <input
            className="form-control"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
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
            autoComplete="new-password"
            required
          />
        </label>

        <button className="button" type="submit" disabled={busy}>
          {busy ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      <p className="form-footer">Already have an account? <a href="/signin">Sign in</a>.</p>
    </section>
  )
}
