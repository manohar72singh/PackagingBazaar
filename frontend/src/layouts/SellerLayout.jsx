import { useState, useEffect } from "react";
import { useNavigate, Outlet, NavLink, useLocation, Navigate } from "react-router-dom";
import { fetchSellerProfile, fetchSellerProducts, fetchSellerStats, fetchSellerOrders } from "../services/sellerServices";
import { AnimatePresence, motion } from "framer-motion";
import NotificationPanel from "../components/notifications/NotificationPanel";


// ─── ICON HELPER ──────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = "currentColor", fill = "none", sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons = {
  dashboard: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  products: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  orders: ["M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z", "M3 6h18", "M16 10a4 4 0 0 1-8 0"],
  profile: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  edit: ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  save: ["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z", "M17 21v-8H7v8", "M7 3v5h8"],
  add: "M12 5v14M5 12h14",
  trash: ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"],
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  menu: "M3 12h18M3 6h18M3 18h18",
  close: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  layers: ["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.99 5.99l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  building: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  package: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  eye: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0"],
  chevronL: "M15 18l-6-6 6-6",
  chevronR: "M9 18l6-6-6-6",
  leads: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.123.544 4.197 1.574 6.035L0 24l6.105-1.602a11.832 11.832 0 005.937 1.57h.005c6.635 0 12.028-5.397 12.033-12.034a11.85 11.85 0 00-3.527-8.483",
};

// ─── BADGE ────────────────────────────────────────────────────────────────────
const Badge = ({ children, color = "gray" }) => {
  const cls = {
    green: "bg-green-100 text-green-700 border-green-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    red: "bg-red-100 text-red-600 border-red-200",
  };
  return <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${cls[color]}`}>{children}</span>;
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, value, label, sub, color, onClick }) => {
  const bg = { orange: "bg-[#e8511a]", blue: "bg-blue-500", green: "bg-green-500", purple: "bg-purple-500" };
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:border-orange-200 hover:shadow-md active:scale-95' : ''}`}
    >
      <div className={`w-10 h-10 sm:w-11 sm:h-11 ${bg[color]} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon d={icons[icon]} size={20} stroke="white" />
      </div>
      <div className="min-w-0">
        <div className="text-lg sm:text-xl font-black text-gray-900 leading-none">{value}</div>
        <div className="text-xs font-medium text-gray-500 mt-0.5 truncate">{label}</div>
        {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
      </div>
    </div>
  );
};

// ─── EDITABLE FIELD ───────────────────────────────────────────────────────────
function EditableField({ label, value, onSave, type = "text", options = null, multiline = false, readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const save = () => { onSave(val); setEditing(false); };
  const cancel = () => { setVal(value); setEditing(false); };

  return (
    <div className="group flex items-start justify-between py-3 sm:py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 mr-3">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
        {editing ? (
          <div className="flex flex-col gap-2">
            {multiline ? (
              <textarea className="w-full text-sm border border-[#e8511a] rounded-xl px-3 py-2 outline-none resize-none bg-orange-50/30" rows={3} value={val} onChange={e => setVal(e.target.value)} />
            ) : options ? (
              <select className="text-sm border border-[#e8511a] rounded-xl px-3 py-2 outline-none bg-orange-50/30 w-full" value={val} onChange={e => setVal(e.target.value)}>
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input type={type} className="w-full text-sm border border-[#e8511a] rounded-xl px-3 py-2 outline-none bg-orange-50/30" value={val} onChange={e => setVal(e.target.value)} autoFocus />
            )}
            <div className="flex gap-2">
              <button onClick={save} className="flex items-center gap-1.5 text-xs bg-[#e8511a] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#d4460f]">
                <Icon d={icons.save} size={11} stroke="white" /> Save
              </button>
              <button onClick={cancel} className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-sm font-medium text-gray-800">{value || <span className="text-gray-400 italic text-xs">Not provided — click Edit to add</span>}</div>
        )}
      </div>
      {!editing && !readOnly && (
        <button onClick={() => setEditing(true)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-[#e8511a] font-semibold shrink-0 mt-1 hover:text-[#d4460f]">
          <Icon d={icons.edit} size={12} /> Edit
        </button>
      )}
    </div>
  );
}

// ─── FILM TAGS EDITOR ─────────────────────────────────────────────────────────
const ALL_FILMS = ["BOPP", "PET", "CPP", "LAMINATED", "Others"];
function FilmTypesEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(value);

  const toggle = (f) => setSelected(s => s.includes(f) ? s.filter(x => x !== f) : [...s, f]);
  const save = () => { onSave(selected); setEditing(false); };

  return (
    <div className="group flex items-start justify-between py-3 sm:py-3.5 border-b border-gray-100">
      <div className="flex-1 mr-3">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Film Types</div>
        {editing ? (
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {ALL_FILMS.map(f => (
                <button key={f} onClick={() => toggle(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${selected.includes(f) ? "bg-[#e8511a] text-white border-[#e8511a]" : "bg-gray-100 text-gray-600 border-gray-200 hover:border-[#e8511a]"}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="flex items-center gap-1.5 text-xs bg-[#e8511a] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#d4460f]">
                <Icon d={icons.save} size={11} stroke="white" /> Save
              </button>
              <button onClick={() => { setSelected(value); setEditing(false); }} className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.length > 0 ? value.map(f => (
              <span key={f} className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full border border-orange-200 font-semibold">{f}</span>
            )) : <span className="text-gray-400 italic text-xs">Not provided — click Edit to add</span>}
          </div>
        )}
      </div>
      {!editing && (
        <button onClick={() => setEditing(true)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-[#e8511a] font-semibold shrink-0 mt-1">
          <Icon d={icons.edit} size={12} /> Edit
        </button>
      )}
    </div>
  );
}

const BUSINESS_TYPES = ["Manufacturer", "Trader", "Stockist", "Distributor", "Converter"];
function BusinessTypesEditor({ value, onSave, readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(value || []);

  const toggle = (f) => setSelected(s => s.includes(f) ? s.filter(x => x !== f) : [...s, f]);
  const save = () => { onSave(selected); setEditing(false); };

  return (
    <div className="group flex items-start justify-between py-3 sm:py-3.5 border-b border-gray-100">
      <div className="flex-1 mr-3">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Business Type</div>
        {editing ? (
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {BUSINESS_TYPES.map(f => (
                <button key={f} onClick={() => toggle(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${selected.includes(f) ? "bg-[#e8511a] text-white border-[#e8511a]" : "bg-gray-100 text-gray-600 border-gray-200 hover:border-[#e8511a]"}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="flex items-center gap-1.5 text-xs bg-[#e8511a] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#d4460f]">
                <Icon d={icons.save} size={11} stroke="white" /> Save
              </button>
              <button onClick={() => { setSelected(value || []); setEditing(false); }} className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.length > 0 ? value.map(f => (
              <span key={f} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">{f}</span>
            )) : <span className="text-gray-400 italic text-xs">Not provided — click Edit to add</span>}
          </div>
        )}
      </div>
      {!editing && !readOnly && (
        <button onClick={() => setEditing(true)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-[#e8511a] font-semibold shrink-0 mt-1">
          <Icon d={icons.edit} size={12} /> Edit
        </button>
      )}
    </div>
  );
}

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/seller/dashboard" },
  { id: "products", label: "My Products", icon: "products", href: "/seller/products" },
  { id: "leads", label: "Business Leads", icon: "leads", href: "/seller/leads" },
  { id: "orders", label: "Orders & History", icon: "orders", href: "/seller/orders" },
  { id: "profile", label: "Seller Profile", icon: "profile", href: "/seller/profile" },
];

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ seller, collapsed, setCollapsed, mobileOpen, setMobileOpen, navigate }) {
  const handleNav = () => {
    setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        flex flex-col bg-gray-900 text-white
        transition-all duration-300 ease-in-out
        h-full
        ${collapsed ? "lg:w-16" : "lg:w-60"}
        ${mobileOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {seller && (
          <div className={`mx-3 mt-3 mb-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 shrink-0 ${collapsed ? "lg:hidden" : ""}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#e8511a] rounded-xl flex items-center justify-center font-black text-xs shrink-0">{seller.avatar}</div>
              <div className="min-w-0">
                <div className="text-[10px] font-black text-orange-400 uppercase tracking-tighter mb-0.5">ID: {seller.uid}</div>
                <div className="text-xs font-bold text-white truncate">{seller.businessName || seller.ownerName}</div>
                <div className={`text-[10px] font-semibold mt-0.5 whitespace-nowrap ${
                  seller.status === 'verified' ? 'text-green-400' :
                  seller.status === 'hold' ? 'text-orange-400' :
                  'text-gray-400'
                }`}>
                  {seller.status === 'verified' ? '✓ Verified Seller' : 
                   seller.status === 'hold' ? '⚠ Account on Hold' : 
                   '○ Verification Pending'}
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.id}
              to={item.href}
              end={item.id === "dashboard"}
              onClick={handleNav}
              className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${isActive ? "bg-[#e8511a] text-white" : "text-white/60 hover:text-white hover:bg-white/5"}
                ${collapsed ? "lg:justify-center" : ""}
              `}
            >
              <Icon d={icons[item.icon]} size={17} />
              <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-2 shrink-0 space-y-0.5">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? "lg:justify-center" : ""}`}
          >
            <Icon d={icons.logout} size={17} />
            <span className={collapsed ? "lg:hidden" : ""}>Logout</span>
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs text-white/25 hover:text-white/50 hover:bg-white/5 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <Icon d={collapsed ? icons.chevronR : icons.chevronL} size={14} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── MAIN LAYOUT ──────────────────────────────────────────────────────────────
export default function SellerLayout() {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [PRODUCTS, setProducts] = useState([]);
  const [ORDERS, setOrders] = useState([]); 
  const [stats, setStats] = useState({ totalProducts: 0, activeProducts: 0, totalOrders: 0, totalLeads: 0, avgRating: 0, totalViews: 0 });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on load
  useEffect(() => {
    const loadSellerData = async () => {
      try {
        const [profileRes, productsRes, statsRes, ordersRes] = await Promise.all([
          fetchSellerProfile(),
          fetchSellerProducts(1, 5),
          fetchSellerStats(),
          fetchSellerOrders(1, 5)
        ]);
        
        if(profileRes.success) {
          setSeller(profileRes.data);
        }
        if(productsRes.success) {
          setProducts(productsRes.data);
        }
        if(statsRes.success) {
          setStats(statsRes.data);
        }
        if(ordersRes.success) {
          setOrders(ordersRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch seller data:", error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Only redirect if it's an authorization issue
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError(error.message || "Something went wrong. Please check your backend connection.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadSellerData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Skeleton Sidebar */}
        <div className="hidden lg:flex flex-col w-60 bg-gray-900 p-4 space-y-4">
          <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
          <div className="space-y-2 flex-1">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        {/* Skeleton Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4">
            <div className="h-5 w-24 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="ml-auto h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
          </div>
          <div className="flex-1 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Icon d={icons.close} size={30} stroke="red" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Sync Error</h2>
        <p className="text-sm text-gray-500 max-w-xs mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Fallback if seller is null
  if (!seller) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        seller={seller}
        collapsed={collapsed} setCollapsed={setCollapsed}
        mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
        navigate={navigate}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-16 flex items-center justify-between shrink-0 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon d={icons.menu} size={22} />
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <h1 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-tight">
                {seller.ownerName.split(" ")[0]}'s <span className="text-orange-600">Dashboard</span>
              </h1>
              <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />
              <div className="text-[10px] sm:text-xs font-bold text-gray-500 truncate max-w-[120px] sm:max-w-none">
                {seller.businessName || seller.ownerName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`hidden md:flex items-center gap-1.5 text-[10px] border px-3 py-1.5 rounded-full font-bold tracking-widest uppercase ${
              seller.status === 'verified' ? 'text-green-600 bg-green-50 border-green-200' :
              seller.status === 'hold' ? 'text-orange-600 bg-orange-50 border-orange-200' :
              'text-gray-500 bg-gray-50 border-gray-200'
            }`}>
              {seller.status === 'verified' && <Icon d={icons.shield} size={11} stroke="#16a34a" />}
              {seller.status || 'pending'}
            </div>
            
            <button
              onClick={() => {
                const name = (seller.ownerName || "").toUpperCase();
                const bName = (seller.businessName || "").toUpperCase();
                const uid = (seller.uid || "").toUpperCase();
                const msg = `Hello Admin, I am *${name}* from *${bName}* (ID: *${uid}*). I want to add a product on PackagingBazaar.`;
                window.open(`https://wa.me/919540248705?text=${encodeURIComponent(msg)}`, "_blank");
              }}
              className="flex flex-row items-center gap-1.5 bg-[#25D366] text-white px-3 py-2 rounded-xl text-[11px] font-black hover:bg-[#128C7E] transition-all shadow-md shadow-green-200/50 uppercase tracking-tighter whitespace-nowrap"
            >
              <Icon d={icons.whatsapp} size={14} stroke="none" fill="white" className="shrink-0" />
              <span className="leading-none">Add Product</span>
            </button>

            <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden sm:block" />
            
            <NotificationPanel />

            <button 
              onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all group"
              title="Logout"
            >
              <Icon d={icons.logout} size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-5 max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
              >
                <Outlet context={{ seller, setSeller, PRODUCTS, ORDERS, stats, icons, Icon, Badge, StatCard, EditableField, FilmTypesEditor, ALL_FILMS, BusinessTypesEditor, BUSINESS_TYPES }} />
              </motion.div>
            </AnimatePresence>
            <div className="h-10" />
          </div>
        </main>
      </div>
    </div>
  );
}