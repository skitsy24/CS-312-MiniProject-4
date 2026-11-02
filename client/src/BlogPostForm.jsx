import { useState } from 'react'
import { postJson } from './api'

export default function BlogPostForm({ onCreated }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      const post = await postJson('/api/posts', { title, body })
      onCreated(post)
      setTitle('')
      setBody('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="post-form" aria-label="Create a post">
      <h2>Create a Post</h2>
      {error && <p className="alert" role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label className="form-label">
          Post Title
          <input className="form-control" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} required />
        </label>
        <label className="form-label">
          Post
          <textarea className="form-control" value={body} onChange={(event) => setBody(event.target.value)} rows={5} required />
        </label>
        <button className="button" type="submit" disabled={busy}>
          {busy ? 'Publishing...' : 'Publish Post'}
        </button>
      </form>
    </section>
  )
}
