import { useEffect, useState } from 'react'
import BlogPostForm from './BlogPostForm'

function PostList({ currentUser }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <>
      {currentUser && !loading && (
        <BlogPostForm onCreated={(post) => {
          setPosts((current) => [post, ...current])
          setError('')
        }} />
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
                <h3>{post.title}</h3>
                <p>By {post.creator_name}</p>
                <p className="post-content">{post.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default PostList
