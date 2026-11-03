import { useEffect, useState } from 'react'
import { sendJson } from './api'
import PostList from './PostList'
import Signin from './Signin'
import Signup from './Signup'
import './App.css'

function App() {
  const [currentUser, setCurrentUser] = useState(undefined)
  const [authError, setAuthError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const page = window.location.pathname

  useEffect(() => {
    const controller = new AbortController()

    async function loadSession() {
      try {
        const response = await fetch('/api/me', { signal: controller.signal })
        if (!response.ok) throw new Error('Could not check your sign-in status.')

        const data = await response.json()
        setCurrentUser(data.user)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setAuthError(requestError.message)
          setCurrentUser(null)
        }
      }
    }

    loadSession()
    return () => controller.abort()
  }, [])

  async function handleLogout() {
    setAuthError('')
    setLoggingOut(true)
    try {
      await sendJson('/api/logout')
      setCurrentUser(null)
    } catch (requestError) {
      setAuthError(requestError.message)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="container blog-page">
      <header className="site-header">
        <h1><a href="/">Our Blog</a></h1>
        <p>Welcome to our blog.</p>
        {currentUser === null && (
          <nav className="mt-3 d-flex gap-2" aria-label="Account">
            <a className="btn btn-primary" href="/signin">Sign In</a>
            <a className="btn btn-primary" href="/signup">Sign Up</a>
          </nav>
        )}
      </header>

      <main>
        {currentUser === undefined && <p>Checking sign-in status...</p>}
        {currentUser && (
          <section className="mb-4" aria-label="Your account">
            <p className="mb-2">Welcome, {currentUser.name}</p>
            <button className="btn btn-primary" type="button" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? 'Signing Out...' : 'Log Out'}
            </button>
          </section>
        )}
        {authError && <p className="alert alert-danger" role="alert">{authError}</p>}

        {currentUser === undefined && page !== '/' ? null : page === '/signin' ? (
          currentUser ? <p>You are already signed in.</p> : <Signin />
        ) : page === '/signup' ? (
          currentUser ? <p>You are already signed in.</p> : <Signup />
        ) : (
          <PostList currentUser={currentUser} />
        )}
      </main>
    </div>
  )
}

export default App
