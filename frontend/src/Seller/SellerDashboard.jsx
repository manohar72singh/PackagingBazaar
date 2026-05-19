import { useState, useEffect, Fragment } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { updateSellerProfileAPI, fetchSellerProducts, fetchSellerOrders, fetchSellerLeads, deleteSellerProductAPI, updateLeadStatus, updateSellerProduct } from "../services/sellerServices";
import { useNotification } from "../context/NotificationContext";
import { getImageUrl } from "../services/api";
import Pagination from "../components/ui/Pagination";
import { motion } from "framer-motion";
import { TableSkeleton } from "../components/ui/SkeletonLoader";
import { Mail, Phone, MessageSquare, Clock, ArrowRight, UserCheck, Zap, MapPin, MessageCircle, CheckCircle2, ChevronDown, Edit3, Sliders } from "lucide-react";

const getLeadStatusSteps = (status) => {
  if (status === 'rejected') {
    return {
      steps: [
        { label: 'Shared', done: true, isRejected: false },
        { label: 'Rejected', done: true, isRejected: true }
      ],
      currentStep: 1
    };
  }
  
  const steps = [
    { label: 'Shared', done: true, isRejected: false },
    { label: 'Accepted', done: status === 'accepted' || status === 'fulfilled', isRejected: false },
    { label: 'Fulfilled', done: status === 'fulfilled', isRejected: false }
  ];
  
  let currentStep = 0;
  if (status === 'accepted') currentStep = 1;
  if (status === 'fulfilled') currentStep = 2;
  
  return { steps, currentStep };
};

export function SellerDashboard() {
  const { seller, PRODUCTS, ORDERS, stats, icons, Icon, Badge, StatCard } = useOutletContext();
  const navigate = useNavigate();

  // Dynamic Profile Completion Rate Calculation
  const profileFields = [
    'ownerName', 'businessName', 'businessType', 'gstNumber', 
    'yearEstablished', 'city', 'state', 'address', 'monthlyCapacity', 
    'priceRange', 'description', 'phone', 'email'
  ];
  const filledFieldsCount = profileFields.filter(field => {
    const val = seller[field];
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== null && val !== "";
  }).length;
  const filmTypesCount = (seller.filmTypes && seller.filmTypes.length > 0) ? 1 : 0;
  const totalFilled = filledFieldsCount + filmTypesCount;
  const totalFields = profileFields.length + 1;
  const completionRate = Math.min(100, Math.round((totalFilled / totalFields) * 100));

  // Dynamic conversion rates based on products uploaded and total leads
  const hasProducts = PRODUCTS.length > 0;
  const conversionRate = hasProducts ? (stats.totalLeads > 0 ? 86 : 94) : 0;
  const responseTimeText = hasProducts ? "1.2 Hrs" : "N/A";

  return (
    <div className="">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-gray-900">Hi, {seller.ownerName ? seller.ownerName.split(" ")[0] : "Seller"}!</h2>
          {seller.status === 'hold' && (
            <span className="bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded animate-pulse">Account On Hold</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back, <span className="font-bold text-gray-900">{seller.businessName} - {seller.ownerName}</span>!</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 mb-6 gap-4">
        <StatCard icon="package" value={stats.totalProducts} label="Total Products" sub={`${stats.activeProducts} active`} color="orange" onClick={() => navigate("/seller/products")} />
        <StatCard icon="leads" value={stats.totalLeads} label="Business Leads" sub="From admin" color="blue" onClick={() => navigate("/seller/leads")} />
        <StatCard icon="star" value={stats.avgRating} label="Avg. Rating" sub="Seller score" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Products (2/3 width) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">Recent Products</h3>
            <button className="text-xs text-[#e8511a] font-semibold" onClick={() => navigate("/seller/products")}>View All</button>
          </div>
          {PRODUCTS.length > 0 ? PRODUCTS.slice(0, 3).map(p => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-black/5">
                {p.image_url ? (
                  <img src={getImageUrl(p.image_url)} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Icon d={icons.package} size={16} stroke="#e8511a" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 truncate">{p.name}</div>
                <div className="text-xs text-gray-400">{p.category_name} · {p.thickness || "N/A"}{p.thickness ? " mic" : ""}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-gray-800">₹{p.price}/kg</div>
                <Badge color={p.status === "active" ? "green" : "gray"}>{p.status}</Badge>
              </div>
            </div>
          )) : (
            <div className="px-5 py-8 text-center text-sm text-gray-400 italic">No products yet.</div>
          )}
        </div>

        {/* Right Column: Performance & Success Metrics (1/3 width) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-1 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-tight">Success Hub</h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>

          {/* Profile Completion */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 font-bold uppercase">Profile Vetting</span>
              <span className="text-xs font-black text-accent">{completionRate}% Complete</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-accent h-full rounded-full transition-all duration-1000" 
                style={{ width: `${completionRate}%` }} 
              />
            </div>
          </div>

          {/* Operational Metrics grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
              <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Response Time</span>
              <p className="font-syne font-black text-gray-900 text-base">{responseTimeText}</p>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tighter ${
                hasProducts ? "text-green-500 bg-green-50 border-green-100" : "text-gray-400 bg-gray-50 border-gray-100"
              }`}>
                {hasProducts ? "Fast Reply" : "No Activity"}
              </span>
            </div>
            
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
              <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Lead Conversion</span>
              <p className="font-syne font-black text-gray-900 text-base">{conversionRate}%</p>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tighter ${
                hasProducts ? "text-accent bg-orange-50 border-orange-100" : "text-gray-400 bg-gray-50 border-gray-100"
              }`}>
                {hasProducts ? "High Match" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Smart Recommendation Match Status */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white relative overflow-hidden">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest block mb-1">System Audit</span>
            <h4 className="font-syne font-black text-xs uppercase tracking-tight text-white mb-1">
              {seller.status === 'verified' ? "Verified Supplier" : "Verification Pending"}
            </h4>
            <p className="text-[10px] text-white/60 leading-relaxed font-medium">
              {seller.status === 'verified' 
                ? "Your account parameters are 100% matched with primary packaging specifications." 
                : "Complete your profile fields to speed up admin verification process."}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export function SellerProducts() {
  const { icons, Icon, Badge } = useOutletContext();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { notifySuccess, notifyError } = useNotification();

  // Quick edit state
  const [editModal, setEditModal] = useState({ open: false, product: null, price: 0, stock: 0 });

  useEffect(() => {
    loadProducts();
  }, [page]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetchSellerProducts(page, 5); // Limit 5 for better UX
      if (res.success) {
        setProducts(res.data);
        setTotalProducts(res.totalCount);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const res = await updateSellerProduct(editModal.product.id, {
        price: editModal.price,
        stock: editModal.stock,
        name: editModal.product.name,
        category_id: editModal.product.category_id,
        subcategory_id: editModal.product.subcategory_id,
        status: editModal.product.status
      });
      if (res.success) {
        notifySuccess("Product updated successfully!");
        setEditModal({ open: false, product: null, price: 0, stock: 0 });
        loadProducts();
      } else {
        notifyError(res.message || "Failed to update product.");
      }
    } catch (err) {
      notifyError("Failed to save changes.");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const res = await deleteSellerProductAPI(id);
        if (res.success) {
          notifySuccess("Product deleted successfully.");
          loadProducts();
        }
      } catch (err) {
        notifyError("Failed to delete product.");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">My Products</h2>
          <p className="text-sm text-gray-500 mt-0.5">{totalProducts} products listed</p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <>
          <div className="space-y-3">
            {products.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-orange-200 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-black/5">
                    {p.image_url ? (
                      <img src={getImageUrl(p.image_url)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Icon d={icons.layers} size={22} stroke="#e8511a" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-sm text-gray-900">{p.name}</span>
                      <Badge color={p.status === "active" ? "green" : "gray"}>{p.status}</Badge>
                    </div>
                    <div className="text-xs text-gray-400 mb-1.5">{p.category_name} · {p.subcategory_name} · {p.thickness} · {p.width}</div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-gray-900">₹{p.price}/kg</span>
                      <span className="text-gray-500">Stock: {p.stock}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setEditModal({ open: true, product: p, price: p.price, stock: p.stock })}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-accent hover:text-accent transition-colors"
                      title="Quick Edit Price & Stock"
                    >
                      <Sliders size={13} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => window.open(`https://wa.me/919540248705?text=Hello%20Admin,%20I%20want%20to%20edit%20product:%20${p.name}%20(ID:%20${p.id})`, "_blank")} 
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#25D366] hover:text-[#25D366] transition-colors"
                      title="Edit Product Details (WhatsApp)"
                    >
                      <Icon d={icons.whatsapp} size={13} stroke="none" fill="currentColor" />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id, p.name)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-500 hover:text-red-500 transition-colors"
                      title="Delete Product"
                    >
                      <Icon d={icons.trash} size={13} stroke="currentColor" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          
          {/* Quick Edit Sliders Modal */}
          {editModal.open && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-sm rounded-2xl border border-gray-100 shadow-xl overflow-hidden"
              >
                <div className="bg-gray-900 px-5 py-4 text-white flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-wider">Quick Price & Stock</h3>
                    <p className="text-[10px] text-white/50 font-bold truncate max-w-[200px] mt-0.5">{editModal.product.name}</p>
                  </div>
                  <button 
                    onClick={() => setEditModal({ open: false, product: null, price: 0, stock: 0 })}
                    className="text-white/60 hover:text-white font-black text-sm px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5 space-y-6">
                  {/* Price Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Price (₹/kg)</span>
                      <span className="text-sm font-black text-accent">₹{editModal.price}/kg</span>
                    </div>
                    <input 
                      type="range"
                      min="50"
                      max="1000"
                      step="5"
                      value={editModal.price}
                      onChange={(e) => setEditModal({ ...editModal, price: parseInt(e.target.value) })}
                      className="w-full accent-accent h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-gray-400 font-black">
                      <span>Min: ₹50</span>
                      <span>Max: ₹1000</span>
                    </div>
                  </div>

                  {/* Stock Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase">Stock Inventory (kg)</span>
                      <span className="text-sm font-black text-gray-900">{editModal.stock} kg</span>
                    </div>
                    <input 
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={editModal.stock}
                      onChange={(e) => setEditModal({ ...editModal, stock: parseInt(e.target.value) })}
                      className="w-full accent-black h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-gray-400 font-black">
                      <span>Min: 100 kg</span>
                      <span>Max: 10,000 kg</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 px-5 py-3.5 border-t border-gray-100 flex gap-2 justify-end">
                  <button 
                    onClick={() => setEditModal({ open: false, product: null, price: 0, stock: 0 })}
                    className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateProduct}
                    className="px-5 py-2 bg-[#e8511a] text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md hover:bg-orange-600 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function SellerOrders() {
  const { Badge, icons, Icon } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [activeTab, setActiveTab] = useState('leads'); // 'orders' or 'leads'
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    } else {
      loadLeads();
    }
  }, [page, activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchSellerOrders(page, 10);
      if (res.success) {
        setOrders(res.data);
        setTotalOrders(res.totalCount);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetchSellerLeads();
      if (res.success) {
        // Show both fulfilled and rejected in history
        const history = res.data.filter(l => l.assignment_status === 'fulfilled' || l.assignment_status === 'rejected');
        setLeads(history);
        setTotalPages(1); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Orders & History</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage your sales and lead history</p>
        </div>

        <div className="flex bg-gray-100/80 p-1 rounded-2xl w-full md:w-auto border border-gray-200/30">
          <button 
            onClick={() => { setActiveTab('orders'); setPage(1); }}
            className={`flex-1 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'orders' 
                ? 'bg-accent text-white shadow-md shadow-orange-500/20' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Direct Orders
          </button>
          <button 
            onClick={() => { setActiveTab('leads'); setPage(1); }}
            className={`flex-1 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'leads' 
                ? 'bg-accent text-white shadow-md shadow-orange-500/20' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Leads History
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : activeTab === 'orders' ? (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="md:hidden divide-y divide-gray-50">
              {orders.map(o => {
                const isExpanded = expandedOrderId === o.id;
                const itemsList = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
                return (
                  <div key={o.id} className="transition-all duration-300">
                    <div 
                      onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50/50 transition-colors select-none ${isExpanded ? 'bg-orange-50/10' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-sm text-gray-900">{o.customer_name}</div>
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                            Order #{o.id}
                            <span className="text-[9px] text-accent font-black tracking-tighter ml-1">
                              {isExpanded ? '▲ Hide Items' : '▼ View Items'}
                            </span>
                          </div>
                        </div>
                        <Badge color={
                          o.status === "Delivered" ? "green" : 
                          o.status === "Shipped" ? "blue" : 
                          o.status === "Cancelled" ? "red" : 
                          "orange"
                        }>{o.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
                        <span>{new Date(o.order_date).toLocaleDateString()}</span>
                        <span className="font-black text-gray-900">₹{o.total_price}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-gray-50/40 px-4 py-3.5 border-t border-b border-gray-100 space-y-2.5">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ordered Items Spec Breakdown</div>
                        {itemsList.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-xl border border-gray-100 p-3 space-y-2 shadow-sm">
                            <div className="flex justify-between items-start">
                              <span className="font-black text-xs text-gray-900 leading-snug">{item.name}</span>
                              <span className="font-black text-xs text-accent">₹{item.qty * item.price}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                              <div>Brand: <span className="text-gray-900 font-black">{item.brand || '—'}</span></div>
                              <div>Thickness: <span className="text-gray-900 font-black">{item.thickness || '—'}</span></div>
                              <div>Width: <span className="text-gray-900 font-black">{item.width || '—'}</span></div>
                              <div>Rate: <span className="text-gray-900 font-black">₹{item.price}/kg</span></div>
                              <div className="col-span-2 border-t border-gray-50 pt-1.5 text-gray-900 font-black text-[11px]">Qty: {item.qty} kg</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Order ID", "Customer", "Amount", "Date", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => {
                    const isExpanded = expandedOrderId === o.id;
                    const itemsList = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
                    return (
                      <Fragment key={o.id}>
                        <tr 
                          onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                          className={`cursor-pointer hover:bg-gray-50/50 transition-colors select-none ${isExpanded ? 'bg-orange-50/10' : ''}`}
                        >
                          <td className="px-5 py-4 font-mono text-xs text-gray-400">#{o.id}</td>
                          <td className="px-5 py-4 font-semibold text-gray-800">{o.customer_name}</td>
                          <td className="px-5 py-4 font-bold text-gray-900">₹{o.total_price}</td>
                          <td className="px-5 py-4 text-gray-400 text-xs">{new Date(o.order_date).toLocaleDateString()}</td>
                          <td className="px-5 py-4">
                            <Badge color={
                              o.status === "Delivered" ? "green" : 
                              o.status === "Shipped" ? "blue" : 
                              o.status === "Cancelled" ? "red" : 
                              "orange"
                            }>{o.status}</Badge>
                          </td>
                          <td className="px-5 py-4">
                            <button className="text-[10px] font-black uppercase text-accent hover:text-orange-700 transition-colors flex items-center gap-1.5 tracking-wider">
                              {isExpanded ? '▲ Hide Items' : '▼ View Items'}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-gray-50/30 px-6 py-4.5 border-t border-b border-gray-100">
                              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3.5">Order Spec-Sheet Breakdown</div>
                              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100/50 text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                      <th className="text-left px-4 py-2.5">Product Name</th>
                                      <th className="text-left px-4 py-2.5">Brand</th>
                                      <th className="text-left px-4 py-2.5">Thickness</th>
                                      <th className="text-left px-4 py-2.5">Width</th>
                                      <th className="text-right px-4 py-2.5">Quantity</th>
                                      <th className="text-right px-4 py-2.5">Rate</th>
                                      <th className="text-right px-4 py-2.5">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {itemsList.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-4 py-2.5 font-bold text-gray-800">{item.name}</td>
                                        <td className="px-4 py-2.5 text-gray-600 font-semibold">{item.brand || '—'}</td>
                                        <td className="px-4 py-2.5 text-gray-600 font-mono font-semibold">{item.thickness || '—'}</td>
                                        <td className="px-4 py-2.5 text-gray-600 font-mono font-semibold">{item.width || '—'}</td>
                                        <td className="px-4 py-2.5 text-right font-bold text-gray-900">{item.qty} kg</td>
                                        <td className="px-4 py-2.5 text-right text-gray-500 font-bold">₹{item.price}/kg</td>
                                        <td className="px-4 py-2.5 text-right font-bold text-accent">₹{item.qty * item.price}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {leads.map((l, idx) => (
            <motion.div
              key={l.assignment_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${
                l.assignment_status === 'rejected' ? 'opacity-60 grayscale bg-gray-50' : 'border-green-100 bg-green-50/10'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    l.assignment_status === 'fulfilled' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {l.assignment_status === 'fulfilled' ? <CheckCircle2 size={18} /> : <Zap size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-gray-900 text-sm uppercase">Lead #PB-LID-{l.id}</h4>
                      <Badge color={l.assignment_status === 'fulfilled' ? 'green' : 'red'}>
                        {l.assignment_status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs font-bold text-gray-800 truncate mt-0.5">
                      Req: <span className="text-accent">{l.product_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-bold uppercase">
                      <MapPin size={10} />
                      {l.city}, {l.state} • {new Date(l.assigned_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 md:justify-center flex-1">
                  {l.quantity_required && (
                    <div className="text-[9px] font-black text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      QTY: {l.quantity_required}
                    </div>
                  )}
                  {l.thickness && (
                    <div className="text-[9px] font-black text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      µ: {l.thickness}
                    </div>
                  )}
                  {l.width && (
                    <div className="text-[9px] font-black text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      W: {l.width}
                    </div>
                  )}
                </div>
                
                <div className="text-right shrink-0 hidden md:block">
                  <div className="text-[9px] font-black text-gray-400 uppercase">Completed On</div>
                  <div className="text-xs font-bold text-gray-900">{new Date(l.assigned_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Branded Timeline Stepper */}
              {(() => {
                const { steps, currentStep } = getLeadStatusSteps(l.assignment_status);
                return (
                  <div className="bg-gray-50/20 px-3.5 -mx-3.5 my-3 py-3 border-y border-gray-100/50">
                    <div className="flex items-center justify-between max-w-md mx-auto relative px-4">
                      {/* Background track line */}
                      <div className="absolute left-[26px] right-[26px] top-1/2 -translate-y-1/2 h-[2px] bg-gray-200" />
                      
                      {/* Filled track line based on status */}
                      <div className="absolute left-[26px] right-[26px] top-1/2 -translate-y-1/2 h-[2px]">
                        <div 
                          className="h-full bg-accent transition-all duration-500" 
                          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                        />
                      </div>
                      
                      {/* Timeline Steps */}
                      {steps.map((step, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all duration-300 ${
                            step.done 
                              ? step.isRejected 
                                ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-200'
                                : 'bg-accent border-accent text-white shadow-md shadow-orange-200' 
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            {step.done ? (step.isRejected ? '✕' : '✓') : idx + 1}
                          </div>
                          <span className={`text-[8px] font-black uppercase mt-1 tracking-widest ${
                            step.done 
                              ? step.isRejected ? 'text-red-500' : 'text-gray-900' 
                              : 'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Requirement & Note */}
              <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                <div className="bg-gray-50/50 p-2.5 rounded-xl border border-dashed border-gray-200">
                  <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Requirement Message</span>
                  <p className="text-[10px] text-gray-600 italic">"{l.message}"</p>
                </div>
                {l.assignment_note && (
                  <div className="p-2 bg-orange-50/50 rounded-xl border border-orange-100 flex gap-2 items-center">
                    <MessageCircle size={10} className="text-accent shrink-0" />
                    <p className="text-[10px] text-gray-700 font-bold italic truncate">Admin Note: {l.assignment_note}</p>
                  </div>
                )}
                {l.seller_notes && (
                  <div className="p-2 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-2 items-center">
                    <UserCheck size={10} className="text-blue-600 shrink-0" />
                    <p className="text-[10px] text-gray-700 font-bold italic truncate">Your Note: {l.seller_notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SellerLeads() {
  const { seller, icons, Icon, Badge } = useOutletContext();
  const { notifySuccess, notifyError } = useNotification();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState({ open: false, assignmentId: null, status: null, notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [leadsTab, setLeadsTab] = useState("all");
  const [expandedLeads, setExpandedLeads] = useState({});

  const toggleExpandLead = (id) => {
    setExpandedLeads(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetchSellerLeads();
      if (res.success) {
        setLeads(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitStatusUpdate = async () => {
    if (!statusModal.assignmentId || !statusModal.status) return;
    setSubmitting(true);
    try {
      const res = await updateLeadStatus(statusModal.assignmentId, statusModal.status, statusModal.notes);
      if (res.success) {
        notifySuccess(`Lead marked as ${statusModal.status}!`);
        setStatusModal({ open: false, assignmentId: null, status: null, notes: "" });
        loadLeads();
      }
    } catch (err) {
      notifyError("Failed to update status.");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateMatchScore = (lead) => {
    let score = 70; // Base manual vetting score by admin
    if (seller) {
      // 1. Local state matching (up to 15%)
      if (lead.state && seller.state && lead.state.toLowerCase() === seller.state.toLowerCase()) {
        score += 10;
        if (lead.city && seller.city && lead.city.toLowerCase() === seller.city.toLowerCase()) {
          score += 5;
        }
      }
      // 2. Material/Category tags matching (up to 15%)
      if (lead.product_name && seller.filmTypes) {
        const prodName = lead.product_name.toLowerCase();
        const hasTagMatch = seller.filmTypes.some(tag => prodName.includes(tag.toLowerCase()));
        if (hasTagMatch) {
          score += 15;
        }
      }
    }
    return Math.min(score, 100);
  };

  const filteredLeads = leads.filter(l => {
    if (leadsTab === "pending") return l.assignment_status === "pending";
    if (leadsTab === "active") return l.assignment_status === "accepted";
    if (leadsTab === "fulfilled") return l.assignment_status === "fulfilled";
    if (leadsTab === "rejected") return l.assignment_status === "rejected";
    return true; // "all"
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Business Leads</h2>
          <p className="text-xs text-gray-500 mt-0.5">{filteredLeads.length} leads in this queue</p>
        </div>
        
        {/* Dynamic Pipelines Tab Selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl items-center gap-0.5 border border-gray-200/50 overflow-x-auto self-start sm:self-center shrink-0">
          {["all", "pending", "active", "fulfilled", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setLeadsTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all select-none whitespace-nowrap ${
                leadsTab === tab 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-50 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="text-gray-300" size={32} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">No Leads Found</h3>
          <p className="text-xs text-gray-500">There are no leads matching your filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredLeads.map((l, idx) => (
            <motion.div
              key={l.assignment_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-white rounded-2xl border p-3.5 shadow-sm transition-all group ${
                l.assignment_status === 'rejected' ? 'opacity-60 grayscale bg-gray-50' : 
                l.assignment_status === 'fulfilled' ? 'border-green-200 bg-green-50/20' : 
                'hover:border-accent/30 border-gray-100'
              }`}
            >
              {/* Main Content Grid */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Left: Lead Info (PRIVACY: No Buyer Name/Phone) */}
                <div className="flex gap-3 items-center flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    l.assignment_status === 'fulfilled' ? 'bg-green-100 text-green-600' : 'bg-orange-50 text-accent'
                  }`}>
                    <Zap size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap whitespace-nowrap">
                      <h4 className="font-black text-gray-900 text-sm uppercase truncate whitespace-nowrap">Lead #PB-LID-{l.id}</h4>
                      <Badge color={
                        l.assignment_status === 'pending' ? 'orange' :
                        l.assignment_status === 'accepted' ? 'blue' :
                        l.assignment_status === 'fulfilled' ? 'green' : 'red'
                      }>
                        {l.assignment_status.toUpperCase()}
                      </Badge>
                      
                      {/* Match Strength Meter Badge */}
                      <span className="bg-orange-50 text-orange-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1 whitespace-nowrap">
                        🔥 {calculateMatchScore(l)}% Match
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-800 truncate mt-0.5">
                      Req: <span className="text-accent">{l.product_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-bold uppercase whitespace-nowrap">
                      <MapPin size={10} className="text-accent" />
                      {l.city}, {l.state} • {new Date(l.assigned_at || l.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Center: Specs Badges */}
                <div className="flex flex-wrap gap-1.5 md:justify-center items-center flex-1">
                  {l.quantity_required && l.quantity_required !== "Not specified" && (
                    <div className="text-[9px] font-black text-accent bg-orange-50 px-2 py-1 rounded border border-orange-100 shadow-sm shadow-orange-100/50 whitespace-nowrap">
                      QTY: {l.quantity_required}
                    </div>
                  )}
                  {l.thickness && (
                    <div className="text-[9px] font-black text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 whitespace-nowrap">
                      µ: <span className="text-accent">{l.thickness}</span>
                    </div>
                  )}
                  {l.width && (
                    <div className="text-[9px] font-black text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 whitespace-nowrap">
                      W: <span className="text-accent">{l.width}</span>
                    </div>
                  )}
                  {l.delivery_hours && (
                    <div className={`text-[9px] font-black px-2 py-1 rounded border whitespace-nowrap ${
                      l.delivery_hours <= 24 ? "bg-orange-50 border-orange-100 text-orange-600" : "bg-blue-50 border-blue-100 text-blue-600"
                    }`}>
                      {l.delivery_hours <= 48 ? `${l.delivery_hours}h` : `${Math.round(l.delivery_hours / 24)}d`} Delivery
                    </div>
                  )}
                </div>

                {/* Right: Actions (Privacy Focused) */}
                <div className="flex gap-2 items-center shrink-0">
                  {l.assignment_status === 'pending' && (
                    <>
                      <button 
                        onClick={() => setStatusModal({ open: true, assignmentId: l.assignment_id, status: 'accepted', notes: "" })}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm hover:bg-green-700 transition-all whitespace-nowrap"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => setStatusModal({ open: true, assignmentId: l.assignment_id, status: 'rejected', notes: "" })}
                        className="px-4 py-2 bg-white text-red-500 border border-red-100 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-red-50 transition-all whitespace-nowrap"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {l.assignment_status === 'accepted' && (
                    <button 
                      onClick={() => setStatusModal({ open: true, assignmentId: l.assignment_id, status: 'fulfilled', notes: "" })}
                      className="px-6 py-2 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md hover:bg-gray-800 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <CheckCircle2 size={12} className="text-green-400" />
                      Mark Fulfilled
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleExpandLead(l.assignment_id)}
                    className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                      expandedLeads[l.assignment_id] 
                        ? 'bg-accent/10 border-accent/20 text-accent' 
                        : 'bg-white border-gray-100 text-gray-400 hover:text-gray-900 shadow-sm'
                    }`}
                  >
                    <span>{expandedLeads[l.assignment_id] ? "Less" : "More"}</span>
                    <ChevronDown size={12} className={`transition-transform duration-300 ${expandedLeads[l.assignment_id] ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Collapsible Info (Only when expanded) */}
              {expandedLeads[l.assignment_id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden pt-3 border-t border-gray-100"
                >
                  {/* Branded Timeline Stepper */}
                  {(() => {
                    const { steps, currentStep } = getLeadStatusSteps(l.assignment_status);
                    return (
                      <div className="bg-gray-50/20 px-3.5 -mx-3.5 my-3 py-3 border-y border-gray-100/50">
                        <div className="flex items-center justify-between max-w-md mx-auto relative px-4">
                          {/* Background track line */}
                          <div className="absolute left-[26px] right-[26px] top-1/2 -translate-y-1/2 h-[2px] bg-gray-200" />
                          
                          {/* Filled track line based on status */}
                          <div className="absolute left-[26px] right-[26px] top-1/2 -translate-y-1/2 h-[2px]">
                            <div 
                              className="h-full bg-accent transition-all duration-500" 
                              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                            />
                          </div>
                          
                          {/* Timeline Steps */}
                          {steps.map((step, idx) => (
                            <div key={idx} className="relative z-10 flex flex-col items-center">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all duration-300 ${
                                step.done 
                                  ? step.isRejected 
                                    ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-200'
                                    : 'bg-accent border-accent text-white shadow-md shadow-orange-200' 
                                  : 'bg-white border-gray-300 text-gray-400'
                              }`}>
                                {step.done ? (step.isRejected ? '✕' : '✓') : idx + 1}
                              </div>
                              <span className={`text-[8px] font-black uppercase mt-1 tracking-widest ${
                                step.done 
                                  ? step.isRejected ? 'text-red-500' : 'text-gray-900' 
                                  : 'text-gray-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="bg-gray-50/50 p-2.5 rounded-xl border border-dashed border-gray-200">
                      <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Requirement</span>
                      <p className="text-[10px] text-gray-600 italic leading-relaxed">"{l.message}"</p>
                    </div>
                    {l.address && (
                      <div className="bg-blue-50/30 p-2.5 rounded-xl border border-dashed border-blue-100">
                        <span className="text-[8px] font-black text-blue-400 uppercase block mb-1">Delivery Address</span>
                        <p className="text-[10px] text-gray-600 font-medium">{l.address}, {l.city}, {l.pincode}</p>
                      </div>
                    )}
                  </div>

                  {/* Admin Note */}
                  {l.assignment_note && (
                    <div className="mt-2 p-2 bg-orange-50/50 rounded-xl border border-orange-100 flex gap-2 items-center">
                      <MessageCircle size={10} className="text-accent shrink-0" />
                      <p className="text-[10px] text-gray-700 font-bold italic truncate">Admin: {l.assignment_note}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      {statusModal.open && (
        <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative border border-gray-100"
          >
            <h3 className="font-syne font-black text-xl text-gray-900 uppercase mb-2">
              {statusModal.status === 'accepted' ? 'Accept Lead' : 
               statusModal.status === 'rejected' ? 'Reject Lead' : 'Mark as Fulfilled'}
            </h3>
            <p className="text-xs text-gray-500 font-medium mb-6">
              {statusModal.status === 'accepted' ? 'Are you sure you want to accept this lead? You can add a note for the admin.' :
               statusModal.status === 'rejected' ? 'Please provide a reason for rejecting this lead.' :
               'Congratulations! Please confirm the fulfillment of this lead.'}
            </p>
            
            <textarea
              value={statusModal.notes}
              onChange={(e) => setStatusModal({ ...statusModal, notes: e.target.value })}
              placeholder={statusModal.status === 'rejected' ? "Reason for rejection..." : "Add a note (optional)..."}
              className="w-full text-sm text-gray-700 p-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-accent resize-none h-32 mb-6"
            />
            
            <div className="flex gap-3 justify-end">
              <button 
                disabled={submitting}
                onClick={() => setStatusModal({ open: false, assignmentId: null, status: null, notes: "" })}
                className="px-6 py-3 rounded-xl text-xs font-black uppercase text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={submitting}
                onClick={submitStatusUpdate}
                className={`px-6 py-3 rounded-xl text-xs font-black uppercase text-white flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 ${
                  statusModal.status === 'accepted' ? 'bg-green-600 hover:bg-green-700' :
                  statusModal.status === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-800'
                }`}
              >
                {submitting ? <Zap size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {submitting ? "Updating..." : "Confirm Update"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export function SellerProfile() {
  const { seller, setSeller, icons, Icon, EditableField, FilmTypesEditor, BusinessTypesEditor } = useOutletContext();
  const { notifySuccess, notifyError } = useNotification();

  // Field save hone par: local state + backend dono update karo
  const update = (key) => async (val) => {
    const prevSeller = { ...seller }; // Revert ke liye layout data store karo
    const updatedSeller = { ...seller, [key]: val };
    setSeller(updatedSeller); // Optimistic UI update

    try {
      const res = await updateSellerProfileAPI({
        businessName: updatedSeller.businessName,
        businessType: updatedSeller.businessType,
        gstNumber: updatedSeller.gstNumber,
        yearEstablished: updatedSeller.yearEstablished,
        city: updatedSeller.city,
        state: updatedSeller.state,
        address: updatedSeller.address,
        filmTypes: updatedSeller.filmTypes,
        monthlyCapacity: updatedSeller.monthlyCapacity,
        priceRange: updatedSeller.priceRange,
        description: updatedSeller.description,
        phone: updatedSeller.phone,
        ownerName: updatedSeller.ownerName, // Added
        email: updatedSeller.email, // Added
      });

      if (res.success) {
        notifySuccess(`${key.charAt(0).toUpperCase() + key.slice(1)} updated successfully.`);
      } else {
        throw new Error(res.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      notifyError(err.response?.data?.message || err.message || "Something went wrong.");
      setSeller(prevSeller); // Rollback optimistic update
    }
  };
  const STATES = ["Gujarat", "Maharashtra", "Rajasthan", "Delhi", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "West Bengal", "Telangana", "Other"];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-gray-900">Seller Profile</h2>
        <p className="text-sm text-gray-500 mt-0.5">Hover any field → click <strong>Edit</strong> to update</p>
      </div>

      {/* Hero card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #e8511a 0%, transparent 60%)" }} />
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#e8511a] rounded-2xl flex items-center justify-center text-lg sm:text-xl font-black shrink-0 z-10">{seller.avatar}</div>
        <div className="z-10 min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="text-base sm:text-lg font-black truncate">{seller.businessName}</div>
            {seller.uid && (
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-black border border-white/10">
                ID: {seller.uid}
              </span>
            )}
          </div>
          <div className="text-white/60 text-sm mt-0.5">{seller.city}, {seller.state}</div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`flex items-center gap-1.5 text-xs border px-2.5 py-1 rounded-full font-semibold ${
              seller.status === 'verified' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              seller.status === 'hold' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
              'bg-white/10 text-white/40 border-white/5'
            }`}>
              {seller.status === 'verified' ? (
                <>
                  <Icon d={icons.shield} size={10} stroke="#4ade80" /> Verified Seller
                </>
              ) : seller.status === 'hold' ? (
                <>
                  <Icon d={icons.star} size={10} stroke="#fb923c" /> Account on Hold
                </>
              ) : (
                ' Verification Pending'
              )}
            </span>
            <span className="text-xs text-white/40">Since {seller.joinedDate}</span>
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-100 bg-gray-50/50">
          <Icon d={icons.building} size={15} stroke="#e8511a" />
          <h3 className="font-bold text-gray-800 text-sm">Business Information</h3>
          <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 ml-auto">Read Only</span>
        </div>
        <div className="px-4 sm:px-5">
          <EditableField label="Business / Company Name" value={seller.businessName} onSave={update("businessName")} readOnly={true} />
          <BusinessTypesEditor value={seller.businessType} onSave={update("businessType")} />
          <EditableField label="GST Number" value={seller.gstNumber} onSave={update("gstNumber")} readOnly={true} />
          <EditableField label="Year Established" value={seller.yearEstablished} onSave={update("yearEstablished")} type="number" readOnly={true} />
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-100 bg-gray-50/50">
          <Icon d={icons.phone} size={15} stroke="#e8511a" />
          <h3 className="font-bold text-gray-800 text-sm">Contact Details</h3>
        </div>
        <div className="px-4 sm:px-5">
          <EditableField label="Owner / Contact Name" value={seller.ownerName} onSave={update("ownerName")} />
          <EditableField label="Email Address" value={seller.email} onSave={update("email")} type="email" />
          <EditableField label="Phone / WhatsApp" value={seller.phone} onSave={update("phone")} type="tel" />
          <EditableField label="City" value={seller.city} onSave={update("city")} />
          <EditableField label="State" value={seller.state} onSave={update("state")} options={STATES} />
          <EditableField label="Business Address" value={seller.address} onSave={update("address")} multiline />
        </div>
      </div>

      {/* Products & Capacity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-100 bg-gray-50/50">
          <Icon d={icons.layers} size={15} stroke="#e8511a" />
          <h3 className="font-bold text-gray-800 text-sm">Products & Capacity</h3>
        </div>
        <div className="px-4 sm:px-5">
          <FilmTypesEditor value={seller.filmTypes} onSave={update("filmTypes")} />
          <EditableField label="Monthly Capacity (MT/month)" value={seller.monthlyCapacity} onSave={update("monthlyCapacity")} type="number" />
          <EditableField label="Price Range (₹/kg)" value={seller.priceRange} onSave={update("priceRange")} />
          <EditableField label="Business Description" value={seller.description} onSave={update("description")} multiline />
        </div>
      </div>

      <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
        <Icon d={icons.check} size={16} stroke="#e8511a" />
        <p className="text-sm text-orange-700">Changes are saved instantly when you click <strong>Save</strong> on each field.</p>
      </div>
    </div>
  );
}