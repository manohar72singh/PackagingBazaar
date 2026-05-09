import React, { useState, useEffect } from "react";
import { 
  XCircle, 
  Package, 
  ShoppingBag, 
  RefreshCcw, 
  MapPin as MapPinIcon, 
  Phone, 
  Zap, 
  CheckCircle2,
  MessageCircle,
  ArrowUpDown,
  IndianRupee,
  Navigation
} from "lucide-react";
import { 
  fetchSellerOrdersAdmin, 
  fetchSellerProductsAdmin, 
  fetchLeadRecommendations,
  shareLeadWithSellerAdmin 
} from "../../services/adminServices";
import { useNotification } from "../../context/NotificationContext";
import { getImageUrl } from "../../services/api";

export default function SubViewOverlay({ entity, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("match"); // match, price, distance
  const [shareModal, setShareModal] = useState({ open: false, seller: null, note: "" });

  const { notifySuccess, notifyError } = useNotification();

  const handleWhatsAppForward = (seller) => {
    if (!entity.inquiryData) return;
    const inquiry = entity.inquiryData;

    const deliveryLine = inquiry.delivery_hours
      ? (inquiry.delivery_hours <= 48
          ? `${inquiry.delivery_hours} Hours`
          : `${Math.round(inquiry.delivery_hours / 24)} Days`)
      : null;

    const lines = [
      `🔔 *New Lead Alert from PackagingBazaar!*`,
      `Hello *${seller.company_name}*,`,
      ``,
      `A buyer is looking for a product matching your profile:`,
      ``,
      `📦 *Product:* ${inquiry.product_name}`,
      inquiry.quantity_required ? `📊 *Quantity Required:* ${inquiry.quantity_required}` : null,
      inquiry.thickness        ? `📏 *Thickness (Micron):* ${inquiry.thickness}` : null,
      inquiry.width            ? `📐 *Width:* ${inquiry.width}` : null,
      inquiry.color            ? `🎨 *Color / Finish:* ${inquiry.color}` : null,
      deliveryLine             ? `🚚 *Expected Delivery:* ${deliveryLine}` : null,
      ``,
      `📍 *Buyer Location:*`,
      inquiry.city    ? `   • City: ${inquiry.city}` : null,
      inquiry.state   ? `   • State: ${inquiry.state}` : null,
      inquiry.pincode ? `   • Pincode: ${inquiry.pincode}` : null,
      inquiry.address ? `   • Address: ${inquiry.address}` : null,
      ``,
      inquiry.message ? `💬 *Requirement:* ${inquiry.message}` : null,
      ``,
      `Please confirm if you can fulfill this order. Reply ASAP!`,
      ``,
      `— PackagingBazaar Team`
    ].filter(line => line !== null).join('\n');

    const url = `https://wa.me/${seller.phone}?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank');
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSendToDashboard = async () => {
    setSubmitting(true);
    try {
      const res = await shareLeadWithSellerAdmin(entity.id, shareModal.seller.id, shareModal.note);
      if (res.success) {
        notifySuccess(`Lead shared with ${shareModal.seller.company_name}!`);
        setItems(prevItems => prevItems.map(item => 
          item.id === shareModal.seller.id ? { ...item, is_assigned: 1 } : item
        ));
        setShareModal({ open: false, seller: null, note: "" });
      }
    } catch (err) {
      notifyError("Failed to share lead");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const loadSubData = async () => {
      setLoading(true);
      try {
        let res;
        if (entity.type === "seller" && entity.mode === "orders") {
          res = await fetchSellerOrdersAdmin(entity.id);
          setItems(res.orders || []);
        } else if (entity.type === "seller" && entity.mode === "products") {
          res = await fetchSellerProductsAdmin(entity.id);
          setItems(res.products || []);
        } else if (entity.type === "lead" && entity.mode === "lead-matching") {
          res = await fetchLeadRecommendations(entity.id);
          setItems(res.recommendations || []);
        }
      } catch (err) {
        notifyError("Failed to load details");
      } finally {
        setLoading(false);
      }
    };
    loadSubData();
  }, [entity]);

  // Handle Sorting
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "price") return (a.best_price || 999999) - (b.best_price || 999999);
    if (sortBy === "distance") return (a.distance_km || 999999) - (b.distance_km || 999999);
    if (sortBy === "dispatch") return (a.best_delivery_hours || 999999) - (b.best_delivery_hours || 999999);
    
    // Default (Best Match): Prioritize Distance as requested by User
    // We still use score as a tie-breaker if distance is exactly same
    const distA = (a.distance_km !== undefined && a.distance_km !== null) ? parseFloat(a.distance_km) : 999999;
    const distB = (b.distance_km !== undefined && b.distance_km !== null) ? parseFloat(b.distance_km) : 999999;
    
    if (distA !== distB) return distA - distB;
    
    // If distance is same, use total score as tie-breaker
    const scoreA = (a.location_score || 0) + (a.product_score || 0);
    const scoreB = (b.location_score || 0) + (b.product_score || 0);
    return scoreB - scoreA;
  });

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0" />
      <div className="relative bg-white rounded-[3rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-8 border-b flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
              {entity.name}
            </h2>
            {entity.mode === "lead-matching" && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Smart Algorithm Ranking</p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
             {entity.mode === "lead-matching" && (
                <div className="flex items-center gap-2 bg-white border border-gray-100 p-1 rounded-xl shadow-sm">
                  <div className="pl-3 pr-1 text-gray-400"><ArrowUpDown size={14} /></div>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-black uppercase text-gray-600 outline-none py-1.5 pr-4 cursor-pointer"
                  >
                    <option value="match">Best Match</option>
                    <option value="dispatch">Fastest Dispatch</option>
                    <option value="price">Lowest Price</option>
                    <option value="distance">Nearest</option>
                  </select>
                </div>
             )}
            <button onClick={onClose} className="p-3 bg-white border rounded-2xl hover:bg-gray-100 transition-all">
              <XCircle />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCcw className="animate-spin mx-auto text-accent" size={40} />
            </div>
          ) : (
            <div className="space-y-4">
              {entity.mode === "products" && sortedItems.map((prod) => (
                  <div key={prod.id} className="p-6 rounded-[2.5rem] bg-gray-50 border border-gray-100 shadow-sm flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-2xl border flex items-center justify-center overflow-hidden">
                        {prod.image_url ? <img src={getImageUrl(prod.image_url)} alt="" className="object-cover w-full h-full" /> : <Package className="text-gray-300" />}
                      </div>
                      <div>
                        <h4 className="font-syne font-black text-gray-900 uppercase tracking-tight">{prod.name}</h4>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase bg-white px-2 py-0.5 rounded-lg border border-black/[0.03]">{prod.thickness}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase bg-white px-2 py-0.5 rounded-lg border border-black/[0.03]">{prod.width}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-8 text-right">
                       <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Price Range</p>
                        <p className="text-xs font-black text-gray-900">₹{prod.price_min}-{prod.price_max}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">In Stock</p>
                        <p className={`text-xs font-black ${prod.stock_qty > 0 ? "text-green-600" : "text-red-500"}`}>{prod.stock_qty} kg</p>
                      </div>
                    </div>
                  </div>
                ))}

              {entity.mode === "lead-matching" && sortedItems.map((seller, idx) => {
                  const totalScore = (seller.location_score || 0) + (seller.product_score || 0);
                  const isBest = sortBy === "match" && idx === 0;
                  
                  return (
                    <div key={`seller-${seller.id}`} className={`p-8 rounded-[2.5rem] border transition-all shadow-sm ${isBest ? "bg-orange-50/50 border-accent/30 shadow-orange-100" : "bg-white border-gray-100"}`}>
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-syne font-black text-gray-900 text-xl uppercase tracking-tighter">{seller.company_name}</h4>
                            {isBest && <span className="bg-accent text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Recommended Match 🥇</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-gray-400 mb-6 font-syne uppercase">
                            <span className="flex items-center gap-1"><MapPinIcon size={12} className="text-accent" /> {seller.city}, {seller.state}</span>
                            <span className="flex items-center gap-1"><IndianRupee size={12} className="text-green-600" /> Best Price: ₹{seller.best_price}</span>
                            {seller.best_delivery_hours && (
                              <span className="flex items-center gap-1"><Zap size={12} className="text-amber-500" /> Dispatch: {seller.best_delivery_hours} Hrs</span>
                            )}
                          </div>

                          <div className="bg-white/80 rounded-3xl p-6 border border-black/[0.03] space-y-4">
                             <div className="flex items-center justify-between mb-2">
                               <p className="text-[10px] font-black text-ink uppercase tracking-widest flex items-center gap-2">
                                 Smart Match Strength 
                                 <span className="text-accent">
                                   {Math.round((totalScore / 1000) * 100)}%
                                 </span>
                               </p>
                               {seller.distance_km !== undefined && (
                                 <div className="flex flex-col gap-1.5 items-end">
                                   <div className="bg-accent/10 text-accent px-3 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-sm shadow-accent/5">
                                     <Navigation size={12} />
                                     {seller.road_distance_km ? `${seller.road_distance_km} km (Road)` : `${parseFloat(seller.distance_km).toFixed(1)} km (Aerial)`}
                                   </div>
                                   {seller.duration_min && (
                                      <div className="bg-green-50 text-green-600 px-3 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5 border border-green-100">
                                        <Zap size={12} />
                                        {seller.duration_min >= 60 
                                          ? `${Math.floor(seller.duration_min / 60)}h ${seller.duration_min % 60}m` 
                                          : `${seller.duration_min} mins`} travel
                                      </div>
                                   )}
                                 </div>
                               )}
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                <MatchItem label="Proximity Score" score={seller.location_score} max={400} />
                                <MatchItem label="Inventory & Price" score={seller.product_score} max={600} />
                                <MatchItem label="Strict Constraints" status={seller.has_stock && seller.moq_fit} score={null} />
                                <MatchItem label="Category Relevance" status={true} score={null} />
                             </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0 w-full md:w-48">
                          <button 
                            onClick={() => handleWhatsAppForward(seller)}
                            className="w-full px-8 py-3 bg-[#25D366] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-all shadow-xl shadow-[#25D366]/20"
                          >
                            <MessageCircle size={14} /> WhatsApp Lead
                          </button>
                          
                          {seller.is_assigned ? (
                            <div className="w-full px-8 py-3 bg-orange-50 border-2 border-orange-100 text-orange-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-not-allowed">
                              <CheckCircle2 size={14} /> Already Assigned
                            </div>
                          ) : (
                            <button 
                              onClick={() => setShareModal({ open: true, seller, note: "" })}
                              className="w-full px-8 py-3 bg-white border-2 border-accent text-accent rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-all shadow-lg shadow-orange-100"
                            >
                              <Zap size={14} /> Assign to Dash
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {shareModal.open && (
        <div className="fixed inset-0 z-[200] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="font-syne font-black text-xl text-gray-900 uppercase mb-2">Assign to {shareModal.seller?.company_name}</h3>
            <p className="text-xs text-gray-500 font-medium mb-6">Add an optional message for the seller dashboard.</p>
            
            <textarea
              value={shareModal.note}
              onChange={(e) => setShareModal({ ...shareModal, note: e.target.value })}
              placeholder="e.g. Bulk requirement, please call immediately..."
              className="w-full text-sm text-gray-700 p-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-accent resize-none h-32 mb-6"
            />
            
            <div className="flex gap-3 justify-end">
              <button 
                disabled={submitting}
                onClick={() => setShareModal({ open: false, seller: null, note: "" })}
                className="px-6 py-3 rounded-xl text-xs font-black uppercase text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={submitting}
                onClick={handleSendToDashboard}
                className="px-6 py-3 rounded-xl text-xs font-black uppercase bg-accent text-white hover:bg-accent/90 transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {submitting ? <RefreshCcw size={14} className="animate-spin" /> : <Zap size={14} />}
                {submitting ? "Assigning..." : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchItem({ label, score, status }) {
  const isZero = score === 0;
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[11px] font-bold ${isZero ? "text-gray-300" : "text-gray-600"}`}>{label}</span>
      <div className="flex items-center gap-2">
        {status !== undefined && (status ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-400" />)}
        {score !== null && (
          <span className={`text-[10px] font-black ${isZero ? "text-gray-300 line-through" : "text-accent"}`}>+{score}</span>
        )}
      </div>
    </div>
  );
}
