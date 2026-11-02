import { useEffect, useState } from 'react'
import BlogPostForm from './BlogPostForm'

function PostList({ currentUser }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

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
    setPosts((current) => [post, ...current])
    setError('')
  }

  function updatePost(updated) {
    setPosts((current) => current.map((post) =>
      post.blog_id === updated.blog_id ? updated : post
    ))
    setEditingId(null)
  }

  return (
    <>
      {currentUser && !loading && editingId === null && (
        <BlogPostForm onSave={addPost} />
      )}
      {currentUser === null && <p>To create a post, <a href="/signin">sign in</a> or <a href="/signup">sign up</a>.</p>}

      <section aria-labelledby="posts-heading">
        <h2 id="posts-heading">Recent Posts</h2>
        {loading && <p>Loading posts...</p>}
        {error && <p className="alert" role="alert">{error}</p>}
        {!loading && !error && posts.length === 0 && <p>No posts yet.</p>}
        {!loading && !error && posts.length > 0 && (
          <ul className="post-list">
            {posts.map((post) => (
              <li key={post.blog_id}>
                {editingId === post.blog_id && currentUser?.userId === post.creator_user_id ? (
                  <BlogPostForm
                    post={post}
                    onSave={updatePost}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <h3>{post.title}</h3>
                    <p>By {post.creator_name}</p>
                    <p className="post-content">{post.body}</p>
                    {currentUser?.userId === post.creator_user_id && (
                      <button className="button" type="button" onClick={() => setEditingId(post.blog_id)}>Edit</button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default PostList
