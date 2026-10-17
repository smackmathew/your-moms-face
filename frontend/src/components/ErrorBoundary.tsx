import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/** Shows what went wrong instead of a blank page, so a visitor can report it. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="wrap band">
        <div className="sec-head">
          <span className="mono">Something broke</span>
          <h2>This page hit a problem</h2>
          <p>Go back to the shop and try again. If it keeps happening, send us the message below.</p>
        </div>
        <pre className="error-detail">{`${this.state.error.message}\n${navigator.userAgent}`}</pre>
        <a href="/" className="btn btn--primary">Back to the shop</a>
      </div>
    );
  }
}
