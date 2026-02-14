import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bell,
  AlertTriangle,
  ShoppingBag,
  LogOut,
  Shield,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: CreditCard, label: "Withdrawals", path: "/admin/withdrawals" },
  { icon: AlertTriangle, label: "Reports", path: "/admin/reports" },
  { icon: ShoppingBag, label: "Purchases", path: "/admin/purchases" },
  { icon: ShieldCheck, label: "Manage Admins", path: "/admin/manage" },
  { icon: Bell, label: "Notifications", path: "/admin/notifications" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Shield size={18} className="text-primary-foreground" />
          </div>
          <span className="font-extrabold text-sidebar-foreground text-lg">Admin</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-sidebar-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  active
                    ? "gradient-primary text-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border flex items-center px-4 lg:px-6 shrink-0 bg-card">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl bg-muted flex items-center justify-center mr-3"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-lg font-extrabold text-foreground">
            {navItems.find((n) => n.path === location.pathname)?.label ?? "Admin"}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
