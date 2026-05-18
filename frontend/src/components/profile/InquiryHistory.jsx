import { useState, useEffect } from "react";
import { Package, Ruler, Calendar, MapPin, MessageSquare, Clock, ArrowUpRight, ShieldCheck, AlertCircle, ShoppingBag, MessageCircle } from "lucide-react";
import { fetchBuyerInquiriesAPI } from "../../services/inquiryServices";
import { useNotification } from "../../context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";
import { getImageUrl } from "../../services/api";

export default function InquiryHistory() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notifyError } = useNotification();
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const itemsPerPage = 3;

  useEffect(() => {
    loadInquiries();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const loadInquiries = async () => {
    try {
      const res = await fetchBuyerInquiriesAPI();
      if (res.success) {
        setInquiries(res.inquiries || []);
      }
    } catch (err) {
      notifyError("Failed to fetch requirements history.");
    } finally {
      setLoading(false);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return inq.status?.toLowerCase() === "pending";
    if (activeFilter === "assigned") return inq.status?.toLowerCase() === "assigned" || inq.status?.toLowerCase() === "shared";
    if (activeFilter === "closed") return inq.status?.toLowerCase() === "deal closed" || inq.status?.toLowerCase() === "fulfilled" || inq.status?.toLowerCase() === "won";
    return true;
  });

  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInquiries = filteredInquiries.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return {
          label: "Under Review",
          bg: "bg-amber-50 text-amber-700 border-amber-100",
          dot: "bg-amber-500",
          icon: <Clock size={12} className="text-amber-500" />
        };
      case "assigned":
      case "shared":
        return {
          label: "Connecting Seller",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-100",
          dot: "bg-indigo-500",
          icon: <ShieldCheck size={12} className="text-indigo-500" />
        };
      case "deal closed":
      case "fulfilled":
      case "won":
        return {
          label: "Deal Closed",
          bg: "bg-green-50 text-green-700 border-green-100",
          dot: "bg-green-500",
          icon: <ShieldCheck size={12} className="text-green-500" />
        };
      case "cancelled":
      case "lost":
      case "rejected":
        return {
          label: "Cancelled",
          bg: "bg-rose-50 text-rose-700 border-rose-100",
          dot: "bg-rose-500",
          icon: <AlertCircle size={12} className="text-rose-500" />
        };
      default:
        return {
          label: status ? status.toUpperCase() : "SUBMITTED",
          bg: "bg-gray-50 text-gray-700 border-gray-100",
          dot: "bg-gray-500",
          icon: <Clock size={12} className="text-gray-500" />
        };
    }
  };

  const getStatusSteps = (status) => {
    const currentStatus = status?.toLowerCase() || "";
    let activeStep = 1;
    if (currentStatus === "under review" || currentStatus === "pending") {
      activeStep = 2;
    } else if (currentStatus === "assigned" || currentStatus === "shared" || currentStatus === "connecting") {
      activeStep = 3;
    } else if (currentStatus === "deal closed" || currentStatus === "fulfilled" || currentStatus === "won" || currentStatus === "closed") {
      activeStep = 4;
    }
    
    return [
      { label: "Submitted", active: activeStep >= 1 },
      { label: "Under Review", active: activeStep >= 2 },
      { label: "Connecting", active: activeStep >= 3 },
      { label: "Closed", active: activeStep >= 4 }
    ];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching your requirements...</p>
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <ShoppingBag size={24} />
        </div>
        <h3 className="font-syne font-black text-gray-900 text-lg uppercase mb-2">No Requirements Found</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
          You haven't submitted any inquiries yet. Send requirements for any product to start getting quotes from verified sellers!
        </p>
        <Link 
          to="/products"
          className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all"
        >
          Browse Products <ArrowUpRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-syne font-black text-gray-900 text-lg uppercase">My Submitted Requirements</h3>
          <p className="text-[11px] text-gray-400">Track quotes and status of your active leads.</p>
        </div>
        <span className="self-start sm:self-auto text-[10px] font-black bg-gray-100 px-3 py-1.5 rounded-full text-gray-500 uppercase tracking-widest">
          Total: {filteredInquiries.length}
        </span>
      </div>

      {/* Modern Status Capsules Filtering */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {[
          { id: "all", label: "All", count: inquiries.length },
          { id: "pending", label: "Under Review", count: inquiries.filter(i => i.status?.toLowerCase() === "pending").length },
          { id: "assigned", label: "Connecting", count: inquiries.filter(i => i.status?.toLowerCase() === "assigned" || i.status?.toLowerCase() === "shared").length },
          { id: "closed", label: "Closed", count: inquiries.filter(i => i.status?.toLowerCase() === "deal closed" || i.status?.toLowerCase() === "fulfilled" || i.status?.toLowerCase() === "won").length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider border transition-all duration-300 flex items-center gap-1.5 ${
              activeFilter === tab.id
                ? "bg-accent border-accent text-white shadow-md shadow-orange-500/20 scale-[1.02]"
                : "bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:text-gray-900"
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${activeFilter === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filteredInquiries.length === 0 ? (
        <div className="text-center py-10 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 px-6">
          <Package size={28} className="text-gray-300 mx-auto mb-2" />
          <h4 className="font-syne font-black text-gray-700 text-xs uppercase tracking-widest">No matching requirements</h4>
          <p className="text-[10px] text-gray-400 mt-1 mb-4">There are no inquiries matching your active filter tab.</p>
          <button
            onClick={() => navigate("/products")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer select-none"
          >
            Submit New Requirement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
          {paginatedInquiries.map((inq) => {
            const statusDetails = getStatusBadge(inq.status);
            const isAssigned = inq.is_assigned === 1;

            return (
              <div 
                key={inq.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
              >
                {/* Top Section: Title & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {inq.image_url ? (
                        <img 
                          src={getImageUrl(inq.image_url)} 
                          alt={inq.product_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/placeholder-product.png";
                          }}
                        />
                      ) : (
                        <Package size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-accent uppercase tracking-widest block mb-0.5">Lead ID: PB-LID-{inq.id}</span>
                      <h4 className="font-syne font-black text-gray-900 text-sm uppercase group-hover:text-accent transition-colors duration-200">
                        {inq.product_name}
                      </h4>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-wider ${statusDetails.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDetails.dot} animate-pulse`} />
                      {statusDetails.icon}
                      {statusDetails.label}
                    </span>
                    
                    {/* Assignment Status Badge */}
                    {isAssigned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Progress Stepper */}
                <div className="py-2 flex items-center justify-between text-[7px] font-black uppercase tracking-wider text-gray-400 select-none border-b border-gray-50 bg-gray-50/20 px-3.5 -mx-3.5">
                  {getStatusSteps(inq.status).map((step, idx, arr) => (
                    <div key={step.label} className="flex-1 flex items-center">
                      <div className="flex items-center gap-1 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center text-[5px] font-black border transition-all ${
                          step.active ? "bg-accent border-accent text-white" : "bg-gray-50 border-gray-200 text-gray-300"
                        }`}>
                          {step.active ? "✓" : ""}
                        </div>
                        <span className={step.active ? "text-accent font-black" : "text-gray-400 font-semibold"}>
                          {step.label}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={`flex-grow h-0.5 mx-2 rounded-full transition-all ${
                          step.active && arr[idx + 1].active ? "bg-accent" : "bg-gray-100"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Grid Specifications Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2.5 border-b border-gray-50 text-[11px] font-bold">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Qty Required</span>
                    <p className="text-gray-900 flex items-center gap-1.5">
                      <Package size={12} className="text-gray-400" /> {inq.quantity_required || "Not Specified"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Thickness</span>
                    <p className="text-gray-900 flex items-center gap-1.5">
                      <Ruler size={12} className="text-gray-400 rotate-90" /> {inq.thickness ? `${inq.thickness}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Width</span>
                    <p className="text-gray-900 flex items-center gap-1.5">
                      <Ruler size={12} className="text-gray-400" /> {inq.width ? `${inq.width}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Submitted On</span>
                    <p className="text-gray-900 flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400" /> {new Date(inq.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Bottom Details: Address & Message */}
                <div className="pt-2.5 space-y-1.5 text-[11px] font-bold">
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-gray-700 leading-tight">
                      <span className="text-gray-400">Delivery Address: </span>
                      {inq.address ? inq.address : `${inq.city}, ${inq.state} - ${inq.pincode}`}
                    </p>
                  </div>

                  {inq.message && (
                    <div className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100/50">
                      <MessageSquare size={13} className="text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-gray-600 font-semibold italic">
                        "{inq.message}"
                      </p>
                    </div>
                  )}

                  {/* WhatsApp Support Button */}
                  <div className="pt-2.5 border-t border-gray-50 mt-1 flex items-center justify-between">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Need instant updates?</span>
                    <a
                      href={`https://wa.me/919667435374?text=${encodeURIComponent(
                        `Hello PackagingBazaar Team, I want to track my requirement PB-LID-${inq.id} (${inq.product_name}). Please connect me to the seller.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba56] text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-green-500/10 cursor-pointer select-none"
                    >
                      <MessageCircle size={12} className="fill-white" />
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Premium Minimalist Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:border-gray-300 hover:text-gray-900 disabled:opacity-40 disabled:hover:border-gray-100 disabled:hover:text-gray-500 transition-all cursor-pointer select-none"
          >
            ← Previous
          </button>
          
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:border-gray-300 hover:text-gray-900 disabled:opacity-40 disabled:hover:border-gray-100 disabled:hover:text-gray-500 transition-all cursor-pointer select-none"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
