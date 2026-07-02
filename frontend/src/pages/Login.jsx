import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Building2, ArrowRight } from "lucide-react";

export default function Login() {
  const { user, login, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (user) nav("/dashboard", { replace: true });
  }, [user, nav]);

  if (user === undefined) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) nav("/dashboard", { replace: true });
  };

  const fillDemo = (e, p) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2" style={{ background: "#F4F4F5" }}>
      {/* Left visual */}
      <div className="hidden md:block relative">
        <img
          src="https://images.unsplash.com/photo-1705250466297-90035b3a2b26?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHx3aG9sZXNhbGUlMjBmYWJyaWMlMjByb2xsc3xlbnwwfHx8fDE3ODI4NDM3ODl8MA&ixlib=rb-4.1.0&q=85"
          alt="Wholesale fabric rolls"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,59,115,0.75) 0%, rgba(0,43,84,0.55) 100%)" }} />
        <div className="relative z-10 h-full flex flex-col justify-start p-12 text-white">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-wider">Kayum Fabrics ERP</span>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: "#0A0A0A" }}>Sign in</h2>
            <p className="text-sm" style={{ color: "#3F3F46" }}>
              Each firm operator has their own account.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
                className="w-full min-h-[48px] px-4 border border-gray-400 rounded-md text-base focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                placeholder="you@kayum.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#3F3F46" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="login-password-input"
                className="w-full min-h-[48px] px-4 border border-gray-400 rounded-md text-base focus:ring-2 focus:ring-[#003B73] focus:border-[#003B73] focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm px-3 py-2 rounded-md" style={{ background: "#FFEBEE", color: "#D32F2F" }} data-testid="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              data-testid="login-submit-button"
              className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-md font-semibold text-white transition-colors disabled:opacity-60"
              style={{ background: "#003B73" }}
            >
              {submitting ? "Signing in..." : (<>Sign in <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-300">
            <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#3F3F46" }}>
              Demo accounts
            </div>
            <div className="space-y-2">
              {[
                { name: "Abdul Kayum Mohammed Salar", e: "salar@kayum.com", p: "salar123" },
                { name: "H.A Kayum & Company", e: "hakayum@kayum.com", p: "hakayum123" },
                { name: "Haji Abdul Kayum and Sons", e: "sons@kayum.com", p: "sons123" },
              ].map((d) => (
                <button
                  key={d.e}
                  type="button"
                  data-testid={`demo-${d.e.split("@")[0]}`}
                  onClick={() => fillDemo(d.e, d.p)}
                  className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                >
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs font-num" style={{ color: "#71717A" }}>{d.e} · {d.p}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
