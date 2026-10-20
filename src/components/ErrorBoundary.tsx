import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm space-y-3 text-center">
            <h2 className="text-xl font-semibold text-card-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              We hit an unexpected issue. Reload the page to continue.
            </p>
            {this.state.message && (
              <p className="text-xs text-muted-foreground">Error: {this.state.message}</p>
            )}
            <Button onClick={this.handleReload} className="w-full">Reload</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
