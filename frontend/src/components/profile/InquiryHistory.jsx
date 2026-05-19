import { useState, useEffect } from "react";
import { Package, Ruler, Calendar, MapPin, MessageSquare, Clock, ArrowUpRight, ShieldCheck, AlertCircle, ShoppingBag, MessageCircle, Phone, Mail, Star, ChevronDown, ChevronUp } from "lucide-react";
import { fetchBuyerInquiriesAPI } from "../../services/inquiryServices";
import { addManualReview } from "../../services/reviewServices";
import { useNotification } from "../../context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";
import { getImageUrl } from "../../services/api";

const getDurationString = (start, end) => {
  if (!start || !end) return null;
  const sDate = new Date(start);
  const eDate = new Date(end);
  const diffMs = eDate - sDate;
  if (diffMs < 0) return null;
  
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} Min${diffMins > 1 ? 's' : ''}`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} Hr${diffHours > 1 ? 's' : ''}`;
  
  const diffDays = Math.round((diffHours / 24) * 10) / 10;
  return `${diffDays} Day${diffDays !== 1 ? 's' : ''}`;
};

export default function InquiryHistory() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notifyError, notifySuccess } = useNotification();
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const itemsPerPage = 3;
  const [expandedCards, setExpandedCards] = useState({});

  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Review Modal States
  const [reviewModal, setReviewModal] = useState({ open: false, product_id: null, product_name: "" });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = async () => {
    if (reviewRating < 1 || reviewRating > 5) {
      return notifyError("Please select a rating between 1 and 5 stars.");
    }
    
    setSubmittingReview(true);
    try {
      const res = await addManualReview({
        product_id: reviewModal.product_id,
        rating: reviewRating,
        comment: reviewComment
      });

      if (res.success) {
        notifySuccess("Review submitted successfully! It is now live.");
        setInquiries(prev => prev.map(inq => 
          inq.product_id === reviewModal.product_id ? { ...inq, is_reviewed: 1 } : inq
        ));
        setReviewModal({ open: false, product_id: null, product_name: "" });
        setReviewComment("");
        setReviewRating(5);
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

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
    if (activeFilter === "closed") return inq.status?.toLowerCase() === "closed" || inq.status?.toLowerCase() === "deal closed" || inq.status?.toLowerCase() === "fulfilled" || inq.status?.toLowerCase() === "won";
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
      case "closed":
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
      <style>{`
        @keyframes dynamicReveal {
          0% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
            filter: blur(4px);
          }
          75% {
            opacity: 0.95;
            transform: translateY(2px) scale(1.008);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }
        .animate-slideDown {
          animation: dynamicReveal 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: top center;
        }
      `}</style>
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
          { id: "closed", label: "Closed", count: inquiries.filter(i => i.status?.toLowerCase() === "closed" || i.status?.toLowerCase() === "deal closed" || i.status?.toLowerCase() === "fulfilled" || i.status?.toLowerCase() === "won").length }
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

                {/* Visual Progress Stepper & View Details Toggle */}
                <div className="py-2.5 flex items-center justify-between text-[7px] font-black uppercase tracking-wider text-gray-400 select-none border-b border-gray-50 bg-gray-50/20 px-3.5 -mx-3.5">
                  {/* Left Side: Stepper */}
                  <div className="flex-grow flex items-center justify-between mr-3 pr-3 border-r border-gray-200/60">
                    {getStatusSteps(inq.status).map((step, idx, arr) => (
                      <div key={step.label} className="flex-1 flex items-center">
                        <div className="flex items-center gap-1 shrink-0">
                          <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center text-[5px] font-black border transition-all ${
                            step.active ? "bg-accent border-accent text-white" : "bg-gray-50 border-gray-200 text-gray-300"
                          }`}>
                            {step.active ? "✓" : ""}
                          </div>
                          <span className={step.active ? "text-accent font-black" : "text-gray-600 font-bold"}>
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

                  {/* Right Side: Toggle Action Button */}
                  <button
                    onClick={() => toggleCard(inq.id)}
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-orange-50/50 border border-gray-200 hover:border-accent hover:text-accent text-[8px] text-gray-600 font-black uppercase tracking-widest rounded-xl transition-all duration-300 shadow-sm cursor-pointer select-none hover:scale-[1.05] active:scale-[0.95]"
                  >
                    <span>{expandedCards[inq.id] ? "Less" : "More"}</span>
                    <ChevronDown 
                      size={10} 
                      className={`stroke-[3.5] transition-transform duration-300 ease-in-out ${
                        expandedCards[inq.id] ? "rotate-180 text-accent" : "text-gray-400"
                      }`} 
                    />
                  </button>
                </div>

                {expandedCards[inq.id] && (
                  <div className="space-y-3 mt-1.5 pt-1.5 border-t border-gray-100 animate-slideDown">
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
                </div>

                  {/* Deal Closure Timeline & Delivery Speed Info */}
                  {['closed', 'deal closed', 'fulfilled', 'won'].includes(inq.status?.toLowerCase()) && inq.closed_at && (
                    <div className="mt-3 p-3 bg-amber-50/40 rounded-2xl border border-amber-100/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-amber-600" />
                        <div>
                          <p className="text-[10px] font-black text-amber-900 uppercase tracking-wider leading-none">Deal Closed</p>
                          <p className="text-[9px] font-bold text-amber-700/80 mt-0.5">
                            {new Date(inq.closed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {getDurationString(inq.created_at, inq.closed_at) && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100/60 border border-amber-200/50 text-amber-900 text-[8px] font-black uppercase tracking-wider rounded-xl shadow-sm">
                          ⏱️ Delivery Time: {getDurationString(inq.created_at, inq.closed_at)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connected/Accepted Sellers */}
                  {inq.accepted_sellers && inq.accepted_sellers.filter(Boolean).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h5 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Connected Sellers ({inq.accepted_sellers.filter(Boolean).length})
                      </h5>
                      <div className="grid grid-cols-1 gap-2.5">
                        {inq.accepted_sellers.filter(Boolean).map((sel) => (
                          <div key={sel.seller_id} className="p-3 bg-green-50/40 rounded-2xl border border-green-100 flex items-center justify-between transition-all hover:bg-green-50">
                            <div className="flex items-center gap-2">
                              <h6 className="font-syne font-black text-gray-900 text-[11px] uppercase tracking-tight">
                                {sel.company_name}
                              </h6>
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-800 text-[8px] font-black uppercase tracking-widest rounded-md">
                                Accepted
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WhatsApp Support Button */}
                  {/* WhatsApp Support & Review Buttons */}
                  <div className="pt-2.5 border-t border-gray-50 mt-1 flex items-center justify-between">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                      {['closed', 'deal closed', 'fulfilled', 'won'].includes(inq.status?.toLowerCase())
                        ? "How was your experience?"
                        : "Need instant updates?"}
                    </span>
                    <div className="flex gap-2">
                      {['closed', 'deal closed', 'fulfilled', 'won'].includes(inq.status?.toLowerCase()) && (
                        inq.is_reviewed ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-400 text-[9px] font-black uppercase tracking-wider rounded-xl select-none">
                            Review Given
                          </span>
                        ) : (
                          <button
                            onClick={() => setReviewModal({ open: true, product_id: inq.product_id, product_name: inq.product_name })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-orange-600 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer select-none"
                          >
                            <Star size={12} className="fill-white text-white" />
                            Leave a Review
                          </button>
                        )
                      )}
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
              )}
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

      {/* ── Product Review Modal ── */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-[200] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={() => setReviewModal({ open: false, product_id: null, product_name: "" })} className="absolute inset-0" />
          
          <div className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl transition-all scale-[1.02]">
            <h3 className="font-syne font-black text-xl text-gray-900 uppercase mb-2">
              Review {reviewModal.product_name}
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">
              Share your experience with this product
            </p>

            {/* Dynamic Star Rating Selector */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="p-1 hover:scale-125 transition-transform cursor-pointer"
                >
                  <Star
                    size={32}
                    className={`transition-colors duration-200 ${
                      star <= reviewRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200 fill-none"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Review Comment Box */}
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="How was the product quality, width, thickness, and delivery speed?..."
              className="w-full text-sm text-gray-700 p-4 rounded-2xl border border-gray-200 bg-gray-50 outline-none focus:border-accent resize-none h-32 mb-6 font-medium"
            />

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                disabled={submittingReview}
                onClick={() => {
                  setReviewModal({ open: false, product_id: null, product_name: "" });
                  setReviewComment("");
                  setReviewRating(5);
                }}
                className="px-6 py-3 rounded-xl text-xs font-black uppercase text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={submittingReview}
                onClick={handleSubmitReview}
                className="px-6 py-3 rounded-xl text-xs font-black uppercase bg-accent text-white hover:bg-accent/90 transition-colors flex items-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
