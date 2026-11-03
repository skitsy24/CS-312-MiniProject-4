import { useState } from 'react'
import { sendJson } from './api'

export default function BlogPostForm({ post, onSave, onCancel }) {
  const editing = Boolean(post)
  const [title, setTitle] = useState(post?.title ?? '')
  const [body, setBody] = useState(post?.body ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const headingId = editing ? `edit-heading-${post.blog_id}` : 'create-heading'

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
    <section className={editing ? 'post-form' : 'post-form mb-5'} aria-labelledby={headingId}>
      <h2 id={headingId}>{editing ? 'Edit Post' : 'Create a Post'}</h2>
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label" htmlFor="post-title">Post Title</label>
          <input className="form-control" id="post-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} required />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="post-body">Post</label>
          <textarea className="form-control" id="post-body" name="body" value={body} onChange={(event) => setBody(event.target.value)} rows={editing ? 8 : 5} required />
        </div>
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving...' : editing ? 'Save Changes' : 'Publish Post'}
          </button>
          {editing && <button className="btn btn-link" type="button" onClick={onCancel} disabled={busy}>Cancel</button>}
        </div>
      </form>
    </section>
  )
}
