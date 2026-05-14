import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  Store, Menu, X, Package, LogOut, ShieldCheck, 
  ChevronDown, Users, LayoutDashboard, ClipboardList, 
  CheckCircle, ShoppingBag, MessageSquare, Plus, Mail, Star, Megaphone, BookOpen
} from "lucide-react";
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from "framer-motion";
import { fetchDashboardStats } from "../services/adminServices";
import NotificationPanel from "../components/notifications/NotificationPanel";

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({ users: true, sellers: true });
  const [stats, setStats] = useState({ totalInquiries: 0, pendingSellers: 0 });
  
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    loadStats();
  }, [location.search]); // Reload stats when tab changes safely or on initial load

  const loadStats = async () => {
    try {
      const res = await fetchDashboardStats();
      if (res.success) setStats(res.stats);
    } catch (err) {
      console.error("Failed to load sidebar stats");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const navGroups = [
    {
      id: "general",
      links: [
        { to: "/admin/dashboard", icon: <LayoutDashboard size={18} />, label: "Overview" },
        { to: "/admin/inquiries", icon: <MessageSquare size={18} />, label: `Leads (${stats.totalInquiries})` },
        { to: "/admin/reviews", icon: <Star size={18} />, label: "Product Reviews" },
        { to: "/admin/contacts", icon: <Mail size={18} />, label: "Contact Messages" },
        { to: "/admin/broadcast", icon: <Megaphone size={18} />, label: "Broadcast Alerts" },
        { to: "/admin/conversion-tracking", icon: <CheckCircle size={18} />, label: "Conversion Hub" },
        { to: "/admin/blogs", icon: <BookOpen size={18} />, label: "Blog Manager" },
      ]
    },
    {
      id: "users",
      label: "User Control",
      icon: <Users size={18} />,
      links: [
        { to: "/admin/users", icon: <Users size={16} />, label: "All Users" },
        { to: "/admin/orders", icon: <ShoppingBag size={16} />, label: "All Orders" },
        { to: "/admin/products", icon: <Package size={16} />, label: "All Products" },
      ]
    },
    {
      id: "sellers",
      label: "Seller Hub",
      icon: <Store size={18} />,
      links: [
        { to: "/admin/sellers", icon: <CheckCircle size={16} />, label: "Active Businesses" },
        { to: "/admin/pending-sellers", icon: <ClipboardList size={16} />, label: `Pending Sellers (${stats.pendingSellers})` },
        { to: "/admin/seller-hub", icon: <ShoppingBag size={16} />, label: "Seller Sales Hub" },
        { to: "/admin/add-product", icon: <Plus size={16} />, label: "Add Seller Product" },
      ]
    }
  ];

  return (
    <div className="bg-[#f0f4f8] flex h-screen overflow-hidden">
      <Toaster position="top-right" />
      
      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-black/[0.07] flex flex-col 
        transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-black/[0.04]">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
               <ShieldCheck size={18} />
             </div>
             <h2 className="text-xl font-syne font-black text-ink">Admin Panel</h2>
           </div>
           
           <button 
             className="ml-auto lg:hidden text-ink3 hover:text-ink p-1"
             onClick={() => setMobileOpen(false)}
           >
             <X size={20} />
           </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          {navGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {group.label ? (
                <div className="space-y-1">
                  <button 
                    onClick={() => toggleMenu(group.id)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${openMenus[group.id] ? "text-red-600 bg-red-50/50" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    <div className="flex items-center gap-2">
                       {group.icon}
                       {group.label}
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${openMenus[group.id] ? "rotate-180" : ""}`} />
                  </button>
                  
                  {openMenus[group.id] && (
                    <div className="pl-4 space-y-1 mt-1 animate-fadeIn">
                       {group.links.map(link => (
                         <NavLink 
                           key={link.to}
                           to={link.to}
                           onClick={() => setMobileOpen(false)}
                           className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${currentPath === link.to ? "bg-gray-900 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                         >
                           {link.icon}
                           {link.label}
                         </NavLink>
                       ))}
                    </div>
                  )}
                </div>
              ) : (
                group.links.map(link => (
                  <NavLink 
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentPath === link.to ? "bg-gradient-to-r from-[#e8511a] to-[#ff7a45] text-white shadow-[0_8px_16px_rgba(232,81,26,0.25)]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                  >
                    {link.icon}
                    {link.label}
                  </NavLink>
                ))
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-black/[0.04] space-y-1.5">
          <button 
             onClick={handleLogout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
             <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Layout Wrapper ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* ── Admin Header ── */}
        <header className="h-16 bg-white border-b border-black/[0.04] flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button 
              className="p-2 text-ink2 hover:text-ink lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <ShieldCheck size={20} className="text-red-500" />
              <h1 className="text-sm sm:text-base font-black text-ink uppercase tracking-tight">
                Control <span className="text-red-600">Center</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-100 text-[10px] font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              Live Admin System
            </div>
            
            <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden sm:block" />
            
            <NotificationPanel />

            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Logout Securely"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* ── Page Content (Scrollable Container) ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 px-4 sm:px-6 md:py-8 lg:px-10 max-w-6xl mx-auto pb-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPath}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
