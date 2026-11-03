import { useEffect, useState } from 'react'
import BlogPostForm from './BlogPostForm'
import { sendJson } from './api'

function PostList({ currentUser }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadPosts() {
      try {
        const response = await fetch('/api/posts', { signal: controller.signal })
        if (!response.ok) throw new Error('Could not load posts.')

        const data = await response.json()
        console.log('Posts from API:', data)
        setPosts(data)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadPosts()
    return () => controller.abort()
  }, [])

  function addPost(post) {
    setPosts((current) => [...current, post])
    setError('')
  }

  function updatePost(updated) {
    setPosts((current) => current.map((post) =>
      post.blog_id === updated.blog_id ? updated : post
    ))
    setEditingId(null)
  }

  async function deletePost(post) {
    if (!window.confirm(`Delete "${post.title}"?`)) return
    setError('')
    setDeletingId(post.blog_id)

    try {
      await sendJson(`/api/posts/${post.blog_id}`, {}, 'DELETE')
      setPosts((current) => current.filter((item) => item.blog_id !== post.blog_id))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {currentUser && !loading && editingId === null && (
        <BlogPostForm onSave={addPost} />
      )}
      {currentUser === null && <p className="mb-5">To create a post, <a href="/signin">sign in</a> or <a href="/signup">sign up</a>.</p>}

      <section aria-labelledby="posts-heading">
        <h2 id="posts-heading">Recent Posts</h2>
        {loading && <p>Loading posts...</p>}
        {error && <p className="alert alert-danger" role="alert">{error}</p>}
        {!loading && !error && posts.length === 0 && <p className="empty-state">No posts yet. Create the first one!</p>}
        {!loading && posts.map((post) => (
          <article className="blog-post" key={post.blog_id}>
            {editingId === post.blog_id && currentUser?.userId === post.creator_user_id ? (
              <BlogPostForm
                post={post}
                onSave={updatePost}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <h3>{post.title}</h3>
                <p className="post-meta">By {post.creator_name}</p>
                <p className="post-content">{post.body}</p>
                {currentUser?.userId === post.creator_user_id && (
                  <div className="post-actions d-flex align-items-center gap-3">
                    <button className="edit-link" type="button" onClick={() => setEditingId(post.blog_id)} disabled={deletingId === post.blog_id}>
                      Edit<span className="visually-hidden"> {post.title}</span>
                    </button>
                    <button className="delete-link" type="button" onClick={() => deletePost(post)} disabled={deletingId === post.blog_id}>
                      {deletingId === post.blog_id ? 'Deleting...' : 'Delete'}<span className="visually-hidden"> {post.title}</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </article>
        ))}
      </section>
    </>
  )
}

export default PostList
