"use client";

import { Component, ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-red-900 to-purple-900">
          <div className="glass max-w-md p-8 text-white text-center">
            <span className="text-6xl mb-4 block">⚠️</span>
            <h1 className="text-2xl font-bold mb-2">Quest Interrupted!</h1>
            <p className="text-white/80 mb-4">
              Something went wrong on your adventure. The wizards have been notified.
            </p>
            <pre className="text-xs text-left bg-black/30 p-3 rounded mb-4 overflow-auto max-h-40">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.href = "/"}
              className="button bg-quest.yellow text-black"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
