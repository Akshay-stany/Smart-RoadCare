import { Component } from "react";
import { Button } from "@/components/ui/button";
import RoadCareLogo from "@/components/common/RoadCareLogo";

export default class ErrorBoundary extends Component {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "An unexpected error occurred" };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[RoadCare ErrorBoundary caught]:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndHome = () => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.clear();
      }
    } catch {}
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans text-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm space-y-4">
            <div className="flex justify-center mb-2">
              <RoadCareLogo size="md" theme="dark" subtext="System Alert" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
            <p className="text-sm text-slate-500">
              The application encountered an unexpected runtime state. You can reload or return to the home screen.
            </p>
            {this.state.message && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-left">
                <p className="text-xs font-mono text-rose-700 break-words">{this.state.message}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button onClick={this.handleReload} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Reload Page
              </Button>
              <Button onClick={this.handleResetAndHome} variant="outline" className="w-full">
                Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
