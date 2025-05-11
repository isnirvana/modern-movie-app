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
      return <div className="p-4">Something went wrong.</div>;
    }
    return this.props.children;
  }
}
