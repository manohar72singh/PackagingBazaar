import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart, Menu, X, Package, User, LogOut,
  LayoutDashboard, ShieldCheck, Store, ChevronDown, Users, ClipboardList
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import NotificationPanel from "../notifications/NotificationPanel";
// ✅ Axios ki jagah modular service import ki
import { fetchUserData } from "../../services/authServices"; 

const roleConfig = {
  admin: { label: "Admin", color: "bg-red-100 text-red-700", icon: <ShieldCheck size={12} /> },
  seller: { label: "Seller", color: "bg-orange-100 text-orange-700", icon: <Store size={12} /> },
  user: { label: "Customer", color: "bg-blue-100 text-blue-700", icon: <User size={12} /> },
};

// ProfileMenu component remains the same...
function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const role = roleConfig[user.role] || roleConfig.user;
  const initials = user.name ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "U";

  const dashboardLink = user.role === "admin" ? "/admin/dashboard" : user.role === "seller" ? "/seller/dashboard" : "/account";
  const profileLink = user.role === "admin" ? "/admin/profile" : user.role === "seller" ? "/seller/profile" : "/profile";

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-1.5 sm:px-2 rounded-xl border border-black/[0.08] hover:bg-surface transition-colors cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <div 
          onClick={(e) => { e.stopPropagation(); navigate(profileLink); setOpen(false); }}
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-accent flex items-center justify-center text-white text-[10px] sm:text-xs font-bold hover:scale-105 transition-transform"
        >
          {initials}
        </div>
        <div className="flex items-center gap-1">
          <span className={`hidden lg:flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full ${role.color}`}>
            {role.icon} {role.label}
          </span>
          <ChevronDown size={14} className={`text-ink2 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-black/[0.07] overflow-hidden z-50 animate-fadeIn">
          <div className="px-4 py-3 border-b border-black/[0.06]">
            <p className="text-sm font-semibold text-ink truncate">{user.name || "User"}</p>
            <p className="text-xs text-ink2 truncate">{user.email || "No email"}</p>
          </div>
          <div className="py-1.5">
            {(user.role === "admin" || user.role === "seller") && (
              <button onClick={() => { navigate(dashboardLink); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink2 hover:bg-surface hover:text-accent transition-colors">
                <LayoutDashboard size={15} /> Dashboard
              </button>
            )}

            {user.role !== "admin" && (
              <>
                <button onClick={() => { navigate("/cart"); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink2 hover:bg-surface hover:text-accent transition-colors">
                  <ShoppingCart size={15} /> My Cart
                </button>
                <button onClick={() => { navigate("/profile?tab=requirements"); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink2 hover:bg-surface hover:text-accent transition-colors">
                  <ClipboardList size={15} /> My Requirements
                </button>
              </>
            )}

            {user.role === "seller" && (
              <button onClick={() => { navigate("/seller/products"); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink2 hover:bg-surface hover:text-accent transition-colors">
                <Store size={15} /> My Products
              </button>
            )}
          </div>
          <div className="border-t border-black/[0.06] py-1.5">
            <button onClick={() => { onLogout(); setOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // ✅ API instance aur service use kar rahe hain (Interceptor token handle kar lega)
        const response = await fetchUserData();
        setUser(response.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
        }
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const links = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Products" },
    { to: "/seller", label: "Seller" },
    { to: "/hot-deals", label: "Hot Deals" },
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <nav className="bg-white border-b border-black/[0.07] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 max-w-[75%] sm:max-w-none">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(232,81,26,0.3)] group-hover:-translate-y-0.5">
            <Package size={16} className="text-white sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-syne font-black text-[17px] sm:text-2xl text-ink leading-none tracking-tight pb-0.5 truncate">
              Packaging<span className="text-accent">Bazaar</span>
            </span>
            <span className="text-[7.5px] sm:text-[11px] font-black text-accent tracking-widest uppercase animate-flashing truncate mt-[1px]">
              We get you Deals, not just leads
            </span>
          </div>
        </Link>

        <ul className="hidden lg:flex items-center gap-4 xl:gap-8">
          {links.map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="text-sm font-medium text-ink2 hover:text-accent transition-colors">{l.label}</Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {user && <NotificationPanel />}
          <button onClick={() => navigate("/cart")} className="relative w-9 h-9 sm:w-10 sm:h-10 border border-black/[0.08] rounded-xl flex items-center justify-center hover:bg-surface transition-colors">
            <ShoppingCart size={18} className="text-ink2" />
            {count > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-accent text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center">{count}</span>}
          </button>

          {!loading && (
            <>
              {user ? (
                <div className="hidden lg:block">
                  <ProfileMenu user={user} onLogout={handleLogout} />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link to="/become-a-seller" className="hidden sm:block bg-accent text-white text-[10px] sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">Become a Seller</Link>
                  <Link to="/login" className="hidden sm:flex items-center gap-1.5 border border-accent text-accent text-[10px] sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors">
                    <User size={15} /> Login
                  </Link>
                </div>
              )}
            </>
          )}

          <button className="lg:hidden p-1.5 sm:p-2 bg-surface hover:bg-gray-100 rounded-xl transition-colors" onClick={() => setOpen(!open)}>
            {open ? <X size={20} className="text-accent" /> : <Menu size={20} className="text-ink" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {open && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[55] transition-opacity animate-fadeIn" 
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Menu Content */}
      {open && (
        <div className="lg:hidden fixed inset-x-4 top-20 bottom-4 bg-white z-[60] rounded-[2.5rem] shadow-2xl overflow-y-auto animate-slideUp border border-black/[0.05] flex flex-col">
          <div className="px-6 py-8 space-y-6">
            <div className="space-y-4">
              <h3 className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[2px] sm:tracking-[3px] mb-2 pl-1">Menu</h3>
              {links.map((l) => (
                <Link 
                  key={l.to} to={l.to} 
                  onClick={() => setOpen(false)} 
                  className="block text-lg sm:text-xl font-syne font-black text-ink hover:text-accent transition-colors py-1"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-black/[0.06] pt-8 space-y-4">
              {!loading && (
                <>
                  {user ? (
                    <div className="space-y-6">
                      <div 
                        onClick={() => { navigate(user.role === "admin" ? "/admin/profile" : user.role === "seller" ? "/seller/profile" : "/profile"); setOpen(false); }}
                        className="bg-surface p-5 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors border border-black/[0.03]"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white text-lg font-black">
                              {user.name ? user.name[0].toUpperCase() : "U"}
                           </div>
                           <div className="min-w-0">
                              <p className="text-base font-black text-ink truncate">{user.name}</p>
                              <p className="text-xs text-ink3 truncate">{user.email}</p>
                           </div>
                        </div>
                      </div>
                      
                        <div className="grid grid-cols-1 gap-2">
                          {(user.role === "admin" || user.role === "seller") && (
                            <button onClick={() => { navigate(user.role === "admin" ? "/admin/dashboard" : user.role === "seller" ? "/seller/dashboard" : "/account"); setOpen(false); }} className="w-full flex items-center gap-3 bg-white border border-black/[0.08] px-4 py-4 rounded-xl text-sm font-bold text-ink2 hover:bg-surface transition-colors">
                              <LayoutDashboard size={18} className="text-accent" /> Dashboard Overview
                            </button>
                          )}
                          {user.role !== "admin" && (
                            <button onClick={() => { navigate("/profile?tab=requirements"); setOpen(false); }} className="w-full flex items-center gap-3 bg-white border border-black/[0.08] px-4 py-4 rounded-xl text-sm font-bold text-ink2 hover:bg-surface transition-colors">
                              <ClipboardList size={18} className="text-accent" /> My Requirements
                            </button>
                          )}
                        </div>

                      <button onClick={() => { handleLogout(); setOpen(false); }} className="w-full flex items-center justify-center gap-2 text-sm font-black text-red-500 py-4 rounded-xl bg-red-50 hover:bg-red-100 transition-all uppercase tracking-widest">
                        <LogOut size={16} /> Logout Securely
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Link to="/login" onClick={() => setOpen(false)} className="block w-full text-center border-2 border-black/5 text-ink text-sm font-bold py-4 rounded-xl hover:bg-surface transition-all">Login</Link>
                      <Link to="/become-a-seller" onClick={() => setOpen(false)} className="block w-full text-center bg-accent text-white text-sm font-bold py-4 rounded-xl hover:shadow-xl hover:shadow-orange-500/20 transition-all">Become a Seller</Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}