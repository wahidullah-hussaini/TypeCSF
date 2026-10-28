import { Component } from 'react';

/* Last line of defence: a rendering error must never leave a blank page. Text is in all
   three languages because the translation layer itself might be what failed. */
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { if (typeof console !== 'undefined') console.error('[TypeCSF]', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={{ maxWidth: 560, margin: '4rem auto', padding: '1.5rem', fontFamily: 'system-ui, sans-serif', lineHeight: 1.7, textAlign: 'center' }}>
        <h1>Something went wrong · مشکلی پیش آمد · یوه ستونزه رامنځته شوه</h1>
        <p>Your saved progress is safe. Reload the page to continue.</p>
        <button type="button" onClick={() => window.location.reload()} style={{ padding: '.6rem 1.4rem', fontSize: '1rem', borderRadius: 12, border: '1px solid #888', cursor: 'pointer' }}>Reload</button>
      </div>
    );
  }
}
