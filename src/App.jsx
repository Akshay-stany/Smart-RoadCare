import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import RequireAuth from "@/components/RequireAuth";
import { Loader2 } from "lucide-react";

// Resilient lazy import that automatically refreshes stale chunk caches on new deployments
function lazyRetry(componentImport) {
  return lazy(async () => {
    try {
      const page = await componentImport();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("rc_chunk_retry");
      }
      return page;
    } catch (error) {
      if (typeof window !== "undefined") {
        const alreadyRetried = window.sessionStorage.getItem("rc_chunk_retry");
        if (!alreadyRetried) {
          window.sessionStorage.setItem("rc_chunk_retry", "true");
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw error;
    }
  });
}

// Lazy-loaded application pages with stale-chunk protection
const Index = lazyRetry(() => import("./pages/Index"));
const AuthPage = lazyRetry(() => import("./pages/AuthPage"));
const AuthCallback = lazyRetry(() => import("./pages/AuthCallback"));
const VerifyOtpPage = lazyRetry(() => import("./pages/VerifyOtpPage"));
const ResetPasswordPage = lazyRetry(() => import("./pages/ResetPasswordPage"));
const Dashboard = lazyRetry(() => import("./pages/Dashboard"));
const ReportPage = lazyRetry(() => import("./pages/ReportPage"));
const MyComplaintsPage = lazyRetry(() => import("./pages/MyComplaintsPage"));
const ComplaintDetailPage = lazyRetry(() => import("./pages/ComplaintDetailPage"));
const MapPage = lazyRetry(() => import("./pages/MapPage"));
const LiveDetectionPage = lazyRetry(() => import("./pages/LiveDetectionPage"));
const ProfilePage = lazyRetry(() => import("./pages/ProfilePage"));
const NotificationsPage = lazyRetry(() => import("./pages/NotificationsPage"));
const AdminDashboard = lazyRetry(() => import("./pages/AdminDashboard"));
const OfficerDashboard = lazyRetry(() => import("./pages/OfficerDashboard"));
const OfficerTaskPage = lazyRetry(() => import("./pages/OfficerTaskPage"));
const HowItWorksPage = lazyRetry(() => import("./pages/HowItWorksPage"));
const AboutPage = lazyRetry(() => import("./pages/AboutPage"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

function RouteLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <span className="text-xs font-semibold text-slate-500">Loading RoadCare...</span>
    </div>
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/complaints/:id" element={<ComplaintDetailPage />} />

            {/* Citizen Routes */}
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/report"
              element={
                <RequireAuth>
                  <ReportPage />
                </RequireAuth>
              }
            />
            <Route
              path="/my-complaints"
              element={
                <RequireAuth>
                  <MyComplaintsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/live-detection"
              element={
                <RequireAuth>
                  <LiveDetectionPage />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="/notifications"
              element={
                <RequireAuth>
                  <NotificationsPage />
                </RequireAuth>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <RequireAuth roles={["admin", "citizen"]}>
                  <AdminDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <RequireAuth roles={["admin", "citizen"]}>
                  <MyComplaintsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/complaints/:id"
              element={
                <RequireAuth roles={["admin", "citizen"]}>
                  <ComplaintDetailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/assign"
              element={
                <RequireAuth roles={["admin", "citizen"]}>
                  <AdminDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <RequireAuth roles={["admin", "citizen"]}>
                  <AdminDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAuth roles={["admin", "citizen"]}>
                  <AdminDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <RequireAuth roles={["admin", "citizen"]}>
                  <ProfilePage />
                </RequireAuth>
              }
            />

            {/* Maintenance Officer Routes */}
            <Route
              path="/officer"
              element={
                <RequireAuth roles={["officer", "admin", "citizen"]}>
                  <OfficerDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/officer/tasks"
              element={
                <RequireAuth roles={["officer", "admin", "citizen"]}>
                  <OfficerDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/officer/tasks/:id"
              element={
                <RequireAuth roles={["officer", "admin", "citizen"]}>
                  <OfficerTaskPage />
                </RequireAuth>
              }
            />
            <Route
              path="/officer/status"
              element={
                <RequireAuth roles={["officer", "admin"]}>
                  <OfficerDashboard />
                </RequireAuth>
              }
            />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
