import { Component } from "react";
import { Button } from "@/components/ui/button";
export default class ErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError(error) {
        return { hasError: true, message: error.message };
    }
    componentDidCatch(_error, _errorInfo) { }
    handleReload = () => {
        window.location.reload();
    };
    render() {
        if (this.state.hasError) {
            return (<div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm space-y-3 text-center">
            <h2 className="text-xl font-semibold text-card-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              We hit an unexpected issue. Reload the page to continue.
            </p>
            {this.state.message && (<p className="text-xs text-muted-foreground">Error: {this.state.message}</p>)}
            <Button onClick={this.handleReload} className="w-full">Reload</Button>
          </div>
        </div>);
        }
        return this.props.children;
    }
}
