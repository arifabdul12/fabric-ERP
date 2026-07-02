import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, FileText, LogOut, Building2, TruckIcon, Undo2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/inventory", label: "Inventory", icon: Package, testid: "nav-inventory" },
  { to: "/purchases", label: "Purchases", icon: TruckIcon, testid: "nav-purchases" },
  { to: "/bills", label: "Sales Bills", icon: FileText, testid: "nav-bills" },
  { to: "/returns", label: "Returns · Credit Notes", icon: Undo2, testid: "nav-returns" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F4F5" }}>
      {/* Sidebar */}
      <aside className="no-print w-64 bg-white border-r border-gray-300 flex flex-col">
        <div className="px-6 py-6 border-b border-gray-300">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5" style={{ color: "#003B73" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#3F3F46" }}>
              Kayum Fabrics ERP
            </span>
          </div>
          <div className="text-sm font-semibold leading-tight" style={{ color: "#0A0A0A" }} data-testid="sidebar-firm-name">
            {user?.firm_name || "—"}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#003B73] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-300 space-y-2">
          <div className="px-3 text-xs" style={{ color: "#71717A" }}>
            <div className="font-semibold text-gray-700">{user?.name}</div>
            <div>{user?.email}</div>
            <div className="uppercase text-[10px] mt-1 font-bold tracking-wider">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
