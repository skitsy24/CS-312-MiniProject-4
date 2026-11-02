import { useState } from 'react'
import { sendJson } from './api'

export default function AuthForm({ signup }) {
  const [values, setValues] = useState({ user_id: '', name: '', password: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const title = signup ? 'Sign Up' : 'Sign In'
  const fields = [
    ['user_id', 'User ID', 'text', 'username'],
    ...(signup ? [['name', 'Name', 'text', 'name']] : []),
    ['password', 'Password', 'password', signup ? 'new-password' : 'current-password'],
  ]

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    try {
      const payload = signup ? values : { user_id: values.user_id, password: values.password }
      const data = await sendJson(signup ? '/api/signup' : '/api/signin', payload)
      if (signup) {
        setMessage(data.message)
        setValues({ ...values, password: '' })
      } else {
        window.location.assign('/')
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="post-form" aria-label={title}>
      <h2>{title}</h2>
      {error && <p className="alert" role="alert">{error}</p>}
      {message && <p className="notice" role="status">{message} <a href="/signin">Sign in</a>.</p>}

      <form onSubmit={handleSubmit}>
        {fields.map(([name, label, type, autoComplete]) => (
          <label className="form-label" key={name}>
            {label}
            <input
              className="form-control"
              name={name}
              type={type}
              autoComplete={autoComplete}
              value={values[name]}
              onChange={(event) => setValues({ ...values, [name]: event.target.value })}
              required
            />
          </label>
        ))}
        <button className="button" type="submit" disabled={busy}>
          {busy ? 'Please wait...' : title}
        </button>
      </form>
      <p className="form-footer">
        {signup ? 'Already have an account?' : 'Need an account?'}{' '}
        <a href={signup ? '/signin' : '/signup'}>{signup ? 'Sign in' : 'Sign up'}</a>.
      </p>
    </section>
  )
}
