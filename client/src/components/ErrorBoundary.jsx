import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('App crashed:', error) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, background: '#1a1612', color: '#faf7f2', fontFamily: 'Georgia, serif' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 400, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ opacity: 0.6, marginBottom: 24, fontSize: 15 }}>Please reload the page. If it keeps happening, contact aevumbyazka@gmail.com.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '14px 28px', background: '#c9a96e', border: 'none', color: '#1a1612', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: 12, cursor: 'pointer' }}>Reload</button>
        </div>
      </div>
    )
  }
}
