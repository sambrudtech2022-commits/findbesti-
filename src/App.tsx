import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
import ChatPage from "./pages/ChatPage";
import CallPage from "./pages/CallPage";
import ProfilePage from "./pages/ProfilePage";
import VideoCallPage from "./pages/VideoCallPage";
import AudioCallPage from "./pages/AudioCallPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import PremiumPage from "./pages/PremiumPage";
import FavoritesPage from "./pages/FavoritesPage";
import WhoLikedMePage from "./pages/WhoLikedMePage";
import EarnCoinsPage from "./pages/EarnCoinsPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminWithdrawalsPage from "./pages/admin/AdminWithdrawalsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminPurchasesPage from "./pages/admin/AdminPurchasesPage";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading } = useAdminCheck();
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Admin routes - no max-w container */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
            <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawalsPage /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
            <Route path="/admin/purchases" element={<AdminRoute><AdminPurchasesPage /></AdminRoute>} />

            {/* App routes */}
            <Route path="/*" element={
              <div className="max-w-lg mx-auto relative min-h-screen bg-background shadow-2xl">
                <Routes>
                  <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                  <Route path="/call" element={<ProtectedRoute><CallPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/video-call/:userId" element={<ProtectedRoute><VideoCallPage /></ProtectedRoute>} />
                  <Route path="/audio-call/:userId" element={<ProtectedRoute><AudioCallPage /></ProtectedRoute>} />
                  <Route path="/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
                  <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
                  <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                  <Route path="/who-liked-me" element={<ProtectedRoute><WhoLikedMePage /></ProtectedRoute>} />
                  <Route path="/earn-coins" element={<ProtectedRoute><EarnCoinsPage /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <BottomNav />
              </div>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
