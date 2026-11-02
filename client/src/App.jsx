import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadPosts() {
      try {
        const response = await fetch('/api/posts', { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Could not load posts.')
        }

        const data = await response.json()
        console.log('Posts from API:', data)
        setPosts(data)
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError(fetchError.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadPosts()
    return () => controller.abort()
  }, [])

  return (
    <main className="blog-page">
      <h1>Our Blog</h1>
      <h2>Recent Posts</h2>

      {loading && <p>Loading posts...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && posts.length === 0 && <p>No posts yet.</p>}
      {!loading && !error && posts.length > 0 && (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.blog_id}>{post.title}</li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
