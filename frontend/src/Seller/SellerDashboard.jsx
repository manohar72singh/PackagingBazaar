import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { updateSellerProfileAPI, fetchSellerProducts, fetchSellerOrders, fetchSellerLeads, deleteSellerProductAPI } from "../services/sellerServices";
import { useNotification } from "../context/NotificationContext";
import { getImageUrl } from "../services/api";
import Pagination from "../components/ui/Pagination";
import { motion } from "framer-motion";
import { TableSkeleton } from "../components/ui/SkeletonLoader";
import { Mail, Phone, MessageSquare, Clock, ArrowRight, UserCheck, Zap, MapPin, MessageCircle } from "lucide-react";

export function SellerDashboard() {
  const { seller, PRODUCTS, ORDERS, stats, icons, Icon, Badge, StatCard } = useOutletContext();
  const navigate = useNavigate();

  return (
    <div className="">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-gray-900">Hi, {seller.ownerName.split(" ")[0]}!</h2>
          {seller.status === 'hold' && (
            <span className="bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded animate-pulse">Account On Hold</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back, <span className="font-bold text-gray-900">{seller.businessName} - {seller.ownerName}</span>!</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 gap-4">
        <StatCard icon="package" value={stats.totalProducts} label="Total Products" sub={`${stats.activeProducts} active`} color="orange" onClick={() => navigate("/seller/products")} />
        <StatCard icon="orders" value={stats.totalOrders} label="Total Orders" sub="Direct sales" color="green" onClick={() => navigate("/seller/orders")} />
        <StatCard icon="leads" value={stats.totalLeads} label="Business Leads" sub="From admin" color="blue" onClick={() => navigate("/seller/leads")} />
        <StatCard icon="star" value={stats.avgRating} label="Avg. Rating" sub="Seller score" color="purple" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm">Recent Direct Orders</h3>
          <button className="text-xs text-[#e8511a] font-semibold" onClick={() => navigate("/seller/orders")}>View All</button>
        </div>
        {ORDERS.length > 0 ? ORDERS.slice(0, 3).map(o => {
          const firstItem = o.items?.[0] || {};
          const itemCount = o.items?.length || 0;
          return (
            <div key={o.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-800 truncate">{o.customer_name}</div>
                <div className="text-xs text-gray-400 truncate">
                  {firstItem.name || "Unknown Product"} 
                  {itemCount > 1 ? ` + ${itemCount - 1} more` : ""} 
                  {firstItem.qty ? ` · ${firstItem.qty} qty` : ""}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-gray-800">₹{o.total_price}</div>
                <Badge color={
                  o.status === "Delivered" ? "green" : 
                  o.status === "Shipped" ? "blue" : 
                  o.status === "Cancelled" ? "red" : 
                  "orange"
                }>{o.status}</Badge>
              </div>
            </div>
          );
        }) : (
          <div className="px-5 py-8 text-center text-sm text-gray-400 italic">No orders received yet.</div>
        )}
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
                      onClick={() => window.open(`https://wa.me/919540248705?text=Hello%20Admin,%20I%20want%20to%20edit%20product:%20${p.name}%20(ID:%20${p.id})`, "_blank")} 
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#25D366] hover:text-[#25D366] transition-colors"
                      title="Edit Product (WhatsApp)"
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
        </>
      )}
    </div>
  );
}

export function SellerOrders() {
  const { Badge } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [page]);

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Direct Orders</h2>
        <p className="text-xs text-gray-500 mt-0.5">{totalOrders} total orders received</p>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {orders.map(o => (
                <div key={o.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-bold text-sm text-gray-900">{o.customer_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Order #{o.id}</div>
                    </div>
                    <Badge color={
                      o.status === "Delivered" ? "green" : 
                      o.status === "Shipped" ? "blue" : 
                      o.status === "Cancelled" ? "red" : 
                      "orange"
                    }>{o.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(o.order_date).toLocaleDateString()}</span>
                    <span className="font-bold text-gray-900">₹{o.total_price}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Order ID", "Customer", "Amount", "Date", "Status"].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors last:border-0">
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-400">#{o.id}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{o.customer_name}</td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">₹{o.total_price}</td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(o.order_date).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5">
                        <Badge color={
                          o.status === "Delivered" ? "green" : 
                          o.status === "Shipped" ? "blue" : 
                          o.status === "Cancelled" ? "red" : 
                          "orange"
                        }>{o.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export function SellerLeads() {
  const { icons, Icon } = useOutletContext();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Business Leads</h2>
        <p className="text-xs text-gray-500 mt-0.5">{leads.length} verified leads shared by admin</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-50 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="text-gray-300" size={32} />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">No Shared Leads Yet</h3>
          <p className="text-xs text-gray-500">Inquiries matched by admin will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {leads.map((l, idx) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm hover:border-accent/30 transition-all group"
            >
              {/* Main Content Grid */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                
                {/* Left: Buyer & Product Basic Info */}
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-accent shrink-0">
                    <Zap size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-gray-900 text-sm uppercase truncate">{l.buyer_name}</h4>
                      <span className="text-[7px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest border border-green-100">Verified</span>
                    </div>
                    <div className="text-xs font-bold text-gray-800 truncate mt-0.5">
                      Req: <span className="text-accent">{l.product_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-bold uppercase">
                      <MapPin size={10} className="text-accent" />
                      {l.city}, {l.state} • {new Date(l.assigned_at || l.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Center: Specs Badges */}
                <div className="flex flex-wrap gap-1.5 md:justify-center flex-1">
                  {l.quantity_required && l.quantity_required !== "Not specified" && (
                    <div className="text-[9px] font-black text-accent bg-orange-50 px-2 py-1 rounded border border-orange-100 shadow-sm shadow-orange-100/50">
                      QTY: {l.quantity_required}
                    </div>
                  )}
                  {l.thickness && (
                    <div className="text-[9px] font-black text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      µ: <span className="text-accent">{l.thickness}</span>
                    </div>
                  )}
                  {l.width && (
                    <div className="text-[9px] font-black text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      W: <span className="text-accent">{l.width}</span>
                    </div>
                  )}
                  {l.color && (
                    <div className="text-[9px] font-black text-gray-600 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                      {l.color}
                    </div>
                  )}
                  {l.delivery_hours && (
                    <div className={`text-[9px] font-black px-2 py-1 rounded border ${
                      l.delivery_hours <= 24 ? "bg-orange-50 border-orange-100 text-orange-600" : "bg-blue-50 border-blue-100 text-blue-600"
                    }`}>
                      {l.delivery_hours <= 48 ? `${l.delivery_hours}h` : `${Math.round(l.delivery_hours / 24)}d`} Delivery
                    </div>
                  )}
                </div>

                {/* Right: Actions Removed (Admin handles communication) */}
              </div>

              {/* Collapsible Info (Message & Address) */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-50">
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
          ))}
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