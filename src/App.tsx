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
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminWithdrawalsPage from "./pages/admin/AdminWithdrawalsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminPurchasesPage from "./pages/admin/AdminPurchasesPage";
import AdminManagePage from "./pages/admin/AdminManagePage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import MaintenanceScreen from "./components/MaintenanceScreen";
import AnnouncementBanner from "./components/AnnouncementBanner";
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
            {/* Admin login - standalone */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin routes - with sidebar layout */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="purchases" element={<AdminPurchasesPage />} />
              <Route path="manage" element={<AdminManagePage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* App routes */}
            <Route path="/*" element={
              <MaintenanceScreen>
                <div className="max-w-lg mx-auto relative min-h-screen bg-background shadow-2xl">
                  <AnnouncementBanner />
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
              </MaintenanceScreen>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
