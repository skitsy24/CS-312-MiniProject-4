import { useState } from 'react'
import { sendJson } from './api'

export default function BlogPostForm({ post, onSave, onCancel }) {
  const editing = Boolean(post)
  const [title, setTitle] = useState(post?.title ?? '')
  const [body, setBody] = useState(post?.body ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      const saved = await sendJson(
        editing ? `/api/posts/${post.blog_id}` : '/api/posts',
        { title, body },
        editing ? 'PATCH' : 'POST'
      )
      onSave(saved)
      if (!editing) {
        setTitle('')
        setBody('')
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="post-form" aria-label={editing ? 'Edit post' : 'Create a post'}>
      <h2>{editing ? 'Edit Post' : 'Create a Post'}</h2>
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
        <div className="form-actions">
          <button className="button" type="submit" disabled={busy}>
            {busy ? 'Saving...' : editing ? 'Save Changes' : 'Publish Post'}
          </button>
          {editing && <button className="button" type="button" onClick={onCancel} disabled={busy}>Cancel</button>}
        </div>
      </form>
    </section>
  )
}
