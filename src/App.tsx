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
import CoinPackPage from "./pages/CoinPackPage";
import SettingsPage from "./pages/SettingsPage";
import ReferralPage from "./pages/ReferralPage";
import LeaderboardPage from "./pages/LeaderboardPage";
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
import AdminSecretsPage from "./pages/admin/AdminSecretsPage";
import AdminCoinPacksPage from "./pages/admin/AdminCoinPacksPage";
import MaintenanceScreen from "./components/MaintenanceScreen";
import AnnouncementBanner from "./components/AnnouncementBanner";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useScreenProtection } from "@/hooks/useScreenProtection";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const RootRoute = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <AuthPage />;
  return <MaintenanceScreen><AnnouncementBanner /><Index /></MaintenanceScreen>;
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
  if (!user) return <Navigate to="/x-panel/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const ScreenProtectionWrapper = ({ children }: { children: React.ReactNode }) => {
  useScreenProtection();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ScreenProtectionWrapper>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Admin login - standalone */}
              <Route path="/x-panel/login" element={<AdminLoginPage />} />

              {/* Admin routes - with sidebar layout */}
              <Route path="/x-panel" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="purchases" element={<AdminPurchasesPage />} />
                <Route path="manage" element={<AdminManagePage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="secrets" element={<AdminSecretsPage />} />
                <Route path="coin-packs" element={<AdminCoinPacksPage />} />
              </Route>

              {/* Root: auth if logged out, home if logged in */}
              <Route path="/" element={<RootRoute />} />
              {/* Legacy redirect */}
              <Route path="/auth" element={<Navigate to="/" replace />} />
              <Route path="/chat" element={<ProtectedRoute><MaintenanceScreen><ChatPage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="/call" element={<ProtectedRoute><MaintenanceScreen><CallPage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><MaintenanceScreen><ProfilePage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><MaintenanceScreen><ProfileEditPage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="/video-call/:userId" element={<ProtectedRoute><VideoCallPage /></ProtectedRoute>} />
              <Route path="/audio-call/:userId" element={<ProtectedRoute><AudioCallPage /></ProtectedRoute>} />
              <Route path="/premium" element={<ProtectedRoute><MaintenanceScreen><PremiumPage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="/favorites" element={<ProtectedRoute><MaintenanceScreen><FavoritesPage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="/who-liked-me" element={<ProtectedRoute><MaintenanceScreen><WhoLikedMePage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="/earn-coins" element={<ProtectedRoute><MaintenanceScreen><EarnCoinsPage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="/coin-pack" element={<ProtectedRoute><MaintenanceScreen><CoinPackPage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><MaintenanceScreen><SettingsPage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="/referral" element={<ProtectedRoute><MaintenanceScreen><ReferralPage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><MaintenanceScreen><LeaderboardPage /></MaintenanceScreen></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </AuthProvider>
        </BrowserRouter>
      </ScreenProtectionWrapper>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
