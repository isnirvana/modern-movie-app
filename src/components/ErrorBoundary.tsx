import { Component, ReactNode } from 'react';

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-xl font-bold">Something went wrong.</h1>
          <p className="text-sm text-gray-400 mt-2">Try reloading the page.</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-6">
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
