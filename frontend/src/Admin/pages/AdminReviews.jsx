import { useState, useEffect } from "react";
import { 
  fetchAllReviews, 
  addManualReview, 
  deleteReview, 
  updateReviewStatus,
  fetchAdminSiteReviews,
  updateSiteReviewStatus,
  deleteSiteReview,
  generateReviewToken,
  fetchReviewTokens
} from "../../services/reviewServices";
import { fetchProducts } from "../../services/productServices";
import { 
  Star, Trash2, CheckCircle, Clock, Plus, 
  Search, MessageSquare, User, Package, X,
  AlertCircle, Copy, Link as LinkIcon, Globe, Layers, CheckCircle2, ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminReviews() {
  const [activeTab, setActiveTab] = useState("product"); // "product" or "site"
  
  // Product Reviews State
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Site Reviews State
  const [siteReviews, setSiteReviews] = useState([]);
  const [reviewTokens, setReviewTokens] = useState([]);
  const [loadingSite, setLoadingSite] = useState(false);
  const [siteSearchTerm, setSiteSearchTerm] = useState("");
  const [generatingToken, setGeneratingToken] = useState(false);

  // Manual Review Form State
  const [formData, setFormData] = useState({
    product_id: "",
    reviewer_name: "",
    rating: 5,
    comment: "",
    status: "approved"
  });

  useEffect(() => {
    loadProductData();
    loadSiteData();
  }, []);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const [reviewsData, productsData] = await Promise.all([
        fetchAllReviews(),
        fetchProducts({ limit: 1000 })
      ]);
      setReviews(reviewsData);
      setProducts(productsData.data || productsData);
    } catch (err) {
      toast.error("Failed to load product reviews");
    } finally {
      setLoading(false);
    }
  };

  const loadSiteData = async () => {
    setLoadingSite(true);
    try {
      const [siteReviewsData, tokensData] = await Promise.all([
        fetchAdminSiteReviews(),
        fetchReviewTokens()
      ]);
      setSiteReviews(siteReviewsData);
      setReviewTokens(tokensData);
    } catch (err) {
      console.error("Failed to load site reviews:", err);
    } finally {
      setLoadingSite(false);
    }
  };

  // ──── PRODUCT REVIEWS HANDLERS ────
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.reviewer_name || !formData.comment) {
      return toast.error("Please fill all fields");
    }

    try {
      const res = await addManualReview(formData);
      if (res.success) {
        toast.success("Review added successfully!");
        setShowAddModal(false);
        setFormData({ product_id: "", reviewer_name: "", rating: 5, comment: "", status: "approved" });
        loadProductData();
      }
    } catch (err) {
      toast.error("Error adding review");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await deleteReview(id);
      if (res.success) {
        toast.success("Review deleted");
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (err) {
      toast.error("Error deleting review");
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      const res = await updateReviewStatus(id, newStatus);
      if (res.success) {
        toast.success(`Review ${newStatus}`);
        setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      toast.error("Error updating status");
    }
  };

  // ──── SITE REVIEWS HANDLERS ────
  const handleSiteStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    try {
      const res = await updateSiteReviewStatus(id, newStatus);
      if (res.success) {
        toast.success(`Site review ${newStatus}`);
        setSiteReviews(siteReviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      toast.error("Error updating status");
    }
  };

  const handleSiteDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this site review?")) return;
    try {
      const res = await deleteSiteReview(id);
      if (res.success) {
        toast.success("Site review deleted successfully");
        setSiteReviews(siteReviews.filter(r => r.id !== id));
      }
    } catch (err) {
      toast.error("Error deleting site review");
    }
  };

  const handleGenerateToken = async () => {
    setGeneratingToken(true);
    try {
      const res = await generateReviewToken();
      if (res.success && res.token) {
        const reviewUrl = `${window.location.origin}/site-review/write?token=${res.token}`;
        
        // Auto copy to clipboard
        await navigator.clipboard.writeText(reviewUrl);
        toast.success("One-time review link copied to clipboard!");
        
        // Refresh tokens list
        const tokensData = await fetchReviewTokens();
        setReviewTokens(tokensData);
      }
    } catch (err) {
      toast.error("Failed to generate review link");
    } finally {
      setGeneratingToken(false);
    }
  };

  const copyExistingLink = (tokenValue) => {
    const reviewUrl = `${window.location.origin}/site-review/write?token=${tokenValue}`;
    navigator.clipboard.writeText(reviewUrl);
    toast.success("Review link copied to clipboard!");
  };

  // Filters
  const filteredReviews = reviews.filter(r => 
    r.reviewer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSiteReviews = siteReviews.filter(r => 
    r.reviewer_name?.toLowerCase().includes(siteSearchTerm.toLowerCase()) ||
    r.company_name?.toLowerCase().includes(siteSearchTerm.toLowerCase()) ||
    r.comment?.toLowerCase().includes(siteSearchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      
      {/* Page Title & Tab Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-syne font-black text-ink uppercase tracking-tight flex items-center gap-3">
             <MessageSquare className="text-accent" size={32} /> Reviews Center
          </h1>
          <p className="text-sm text-ink3 mt-1.5 font-medium">Manage and audit product feedback and site-wide reviews</p>
        </div>

        {/* Tab Controls */}
        <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1 w-fit select-none border border-slate-200/50">
          <button 
            onClick={() => setActiveTab("product")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === "product" 
              ? "bg-white text-ink shadow-sm" 
              : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Layers size={13} /> Product Reviews
          </button>
          <button 
            onClick={() => setActiveTab("site")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              activeTab === "site" 
              ? "bg-white text-ink shadow-sm" 
              : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Globe size={13} /> Site Reviews
          </button>
        </div>
      </div>

      {/* ──── TAB 1: PRODUCT REVIEWS PANEL ──── */}
      {activeTab === "product" && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          {/* Action buttons */}
          <div className="flex justify-end">
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-black/10 cursor-pointer"
            >
              <Plus size={18} /> Add Manual Review
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-black/[0.05] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Reviews</p>
                  <h3 className="text-2xl font-syne font-black text-ink">{reviews.length}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-black/[0.05] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Approved</p>
                  <h3 className="text-2xl font-syne font-black text-ink">{reviews.filter(r => r.status === 'approved').length}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-black/[0.05] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
                  <h3 className="text-2xl font-syne font-black text-ink">{reviews.filter(r => r.status === 'pending').length}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-[2.5rem] border border-black/[0.05] shadow-xl shadow-black/5 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
               <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Search product reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  />
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reviewer</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Comment</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-20 text-center">
                         <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading reviews...</p>
                         </div>
                      </td>
                    </tr>
                  ) : filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-20 text-center">
                         <div className="flex flex-col items-center gap-3">
                            <AlertCircle className="text-gray-200" size={48} />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No reviews found</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((review) => (
                      <tr key={review.id} className="group hover:bg-gray-50/30 transition-all">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                              <Package size={20} className="text-gray-400" />
                            </div>
                            <p className="font-black text-gray-900 text-sm truncate max-w-[150px]">{review.product_name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <User size={14} className="text-gray-400" />
                             <p className="font-bold text-gray-700 text-sm">{review.reviewer_name || review.user_name || "Anonymous"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={12} 
                                className={i < review.rating ? "fill-orange-400 text-orange-400" : "text-gray-200"} 
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-gray-600 text-xs line-clamp-2 italic max-w-[250px]">"{review.comment}"</p>
                        </td>
                        <td className="px-6 py-5">
                           <button 
                            onClick={() => handleStatusToggle(review.id, review.status)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                              review.status === 'approved' 
                              ? "bg-green-50 text-green-600 border border-green-100" 
                              : "bg-orange-50 text-orange-600 border border-orange-100"
                            }`}
                           >
                             {review.status}
                           </button>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => handleDelete(review.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──── TAB 2: SITE REVIEWS & TOKENS PANEL ──── */}
      {activeTab === "site" && (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
          
          {/* Top Actions: Generate secure link */}
          <div className="bg-white p-6 rounded-[2rem] border border-black/[0.05] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-base font-syne font-black text-ink uppercase tracking-tight flex items-center gap-2">
                <Globe size={18} className="text-accent" /> One-Time Invitation Links
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                Generate highly secure, single-use feedback invitations for buyers/sellers
              </p>
            </div>
            
            <button
              onClick={handleGenerateToken}
              disabled={generatingToken}
              className="flex items-center justify-center gap-2 bg-accent hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-orange-500/10 cursor-pointer disabled:opacity-50"
            >
              <LinkIcon size={14} /> {generatingToken ? "Generating Link..." : "Generate & Copy Invite Link"}
            </button>
          </div>

          {/* Grid Layout for Tokens Tracking and Site Reviews List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Invitation Tokens List (Takes 1 width) */}
            <div className="bg-white rounded-[2.5rem] border border-black/[0.05] shadow-xl shadow-black/5 overflow-hidden h-fit">
              <div className="p-5 border-b border-gray-50">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Invite Link Status Log ({reviewTokens.length})
                </h3>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-50/60 scrollbar-hide">
                {loadingSite ? (
                  <div className="p-8 text-center text-xs font-black text-gray-400 uppercase tracking-widest">
                    Fetching Link Logs...
                  </div>
                ) : reviewTokens.length === 0 ? (
                  <div className="p-8 text-center text-xs font-bold text-gray-400 italic">
                    No invitation links generated yet.
                  </div>
                ) : (
                  reviewTokens.map((t) => (
                    <div key={t.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          {t.is_used === 1 ? (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 border border-red-100 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                              <ShieldAlert size={8} /> Used
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 border border-green-100 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse">
                              <CheckCircle2 size={8} /> Active
                            </span>
                          )}
                          <span className="text-[8px] font-bold text-slate-400">
                            {new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 truncate select-all">
                          ...{t.token.slice(-12)}
                        </p>
                      </div>
                      
                      {t.is_used === 0 && (
                        <button
                          onClick={() => copyExistingLink(t.token)}
                          className="p-2 text-slate-400 hover:text-accent hover:bg-accent/5 rounded-xl border border-slate-100 hover:border-accent/15 transition-all cursor-pointer shrink-0"
                          title="Copy Invitation Link"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Columns 2 & 3: Site Reviews Moderator Panel (Takes 2 widths) */}
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-black/[0.05] shadow-xl shadow-black/5 overflow-hidden">
              <div className="p-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Live Site Reviews Moderation
                </h3>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search site reviews..."
                    value={siteSearchTerm}
                    onChange={(e) => setSiteSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reviewer & Profile</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Feedback message</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loadingSite ? (
                      <tr>
                        <td colSpan="5" className="py-20 text-center">
                           <div className="flex flex-col items-center gap-3">
                              <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading site reviews...</p>
                           </div>
                        </td>
                      </tr>
                    ) : filteredSiteReviews.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-20 text-center">
                           <div className="flex flex-col items-center gap-3">
                              <AlertCircle className="text-gray-200" size={48} />
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No reviews submitted yet</p>
                           </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSiteReviews.map((r) => (
                        <tr key={r.id} className="group hover:bg-gray-50/30 transition-all">
                          <td className="px-6 py-5">
                            <div>
                              <p className="font-black text-gray-900 text-sm">{r.reviewer_name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                {r.designation ? `${r.designation}${r.company_name ? `, ${r.company_name}` : ""}` : (r.company_name || "Platform User")}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={11} 
                                  className={i < r.rating ? "fill-orange-400 text-orange-400" : "text-gray-200"} 
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-gray-600 text-xs italic line-clamp-2 max-w-[200px]" title={r.comment}>
                              "{r.comment}"
                            </p>
                          </td>
                          <td className="px-6 py-5">
                            <button 
                              onClick={() => handleSiteStatusToggle(r.id, r.status)}
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all cursor-pointer ${
                                r.status === 'approved' 
                                ? "bg-green-50 text-green-600 border border-green-100" 
                                : "bg-orange-50 text-orange-600 border border-orange-100"
                              }`}
                            >
                              {r.status}
                            </button>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button 
                              onClick={() => handleSiteDelete(r.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
          <div className="bg-white w-full max-w-md rounded-[2rem] relative z-10 shadow-2xl overflow-hidden animate-slideUp border border-white/20">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-lg font-syne font-black text-ink uppercase tracking-tight">New Review</h2>
                <p className="text-[10px] text-ink3 font-medium uppercase tracking-widest">Manual Customer Entry</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddReview} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-hide">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Product</label>
                <select 
                  value={formData.product_id}
                  onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="">Choose product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reviewer Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={formData.reviewer_name}
                  onChange={(e) => setFormData({...formData, reviewer_name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rating</label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 w-fit">
                   {[1,2,3,4,5].map(num => (
                      <button 
                        type="button"
                        key={num}
                        onClick={() => setFormData({...formData, rating: num})}
                        className={`transition-all ${formData.rating >= num ? "text-orange-400 scale-110" : "text-gray-200"}`}
                      >
                        <Star size={20} fill={formData.rating >= num ? "currentColor" : "none"} />
                      </button>
                   ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Review Message</label>
                <textarea 
                  placeholder="Type customer's feedback here..."
                  rows="3"
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 mt-2"
              >
                Post Review
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
