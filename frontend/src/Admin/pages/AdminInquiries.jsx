import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  Search, 
  Zap,
  RefreshCcw,
  MessageCircle,
  Save,
  Filter,
  Share2,
  Send,
  XCircle,
  CheckCircle2,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import { 
  fetchInquiriesAdmin, 
  updateInquiryAdmin, 
  shareLeadWithSellerAdmin,
  fetchInquiryAssignedSellers,
  downloadExport
} from "../../services/adminServices";
import { useNotification } from "../../context/NotificationContext";
import Pagination from "../../components/ui/Pagination";
import SubViewOverlay from "../components/SubViewOverlay";
import { motion } from "framer-motion";

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusModal, setStatusModal] = useState({ open: false, inquiry: null, status: "", sellers: [] });
  const [expandedLeads, setExpandedLeads] = useState({});
  const toggleExpandLead = (id) => setExpandedLeads(p => ({ ...p, [id]: !p[id] }));
  const [filters, setFilters] = useState({
    status: "",
    product: ""
  });
  const [uniqueProducts, setUniqueProducts] = useState([]);
  const { notifyError, notifySuccess } = useNotification();
  const [exporting, setExporting] = useState(false);
  const [submitting, setSubmitting] = useState(null); // inquiryId

  const debounceRef = useRef(null);

  useEffect(() => {
    loadInquiries(1, search, filters);
  }, []);

  // Debounced search — fires API call 400ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadInquiries(1, search, filters);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const loadInquiries = async (page, searchTerm = search, currentFilters = filters) => {
    setLoading(true);
    try {
      const res = await fetchInquiriesAdmin(page, 10, searchTerm, currentFilters);
      if (res.success) {
        setInquiries(res.inquiries);
        setTotalPages(res.totalPages || 1);
        setCurrentPage(res.currentPage || 1);
        if (res.uniqueProducts) setUniqueProducts(res.uniqueProducts);
      }
    } catch (err) {
      notifyError("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadInquiries(1, search, newFilters);
  };

  const filteredInquiries = inquiries;

  const handleStatusClick = async (inquiry, newStatus) => {
    if (newStatus === 'Closed') {
      try {
        const res = await fetchInquiryAssignedSellers(inquiry.id);
        setStatusModal({ open: true, inquiry, status: newStatus, sellers: res.sellers || [] });
      } catch (err) {
        notifyError("Failed to fetch assigned sellers");
      }
    } else if (newStatus === 'Lost') {
      setStatusModal({ open: true, inquiry, status: newStatus, sellers: [] });
    } else {
      handleStatusChange(inquiry.id, newStatus);
    }
  };

  const handleStatusChange = async (id, newStatus, extraData = {}) => {
    setSubmitting(id);
    try {
      const res = await updateInquiryAdmin(id, { status: newStatus, ...extraData });
      if (res.success) {
        notifySuccess("Status updated!");
        setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: newStatus, ...extraData } : i));
        setStatusModal({ open: false, inquiry: null, status: "", sellers: [] });
      }
    } catch (err) {
      notifyError("Failed to update status");
    } finally {
      setSubmitting(null);
    }
  };

  const handleNotesChange = async (id, notes) => {
    setSubmitting(id);
    try {
      const res = await updateInquiryAdmin(id, { admin_notes: notes });
      if (res.success) {
        notifySuccess("Notes saved!");
        setInquiries(prev => prev.map(i => i.id === id ? { ...i, admin_notes: notes } : i));
      }
    } catch (err) {
      notifyError("Failed to save notes");
    } finally {
      setSubmitting(null);
    }
  };

  const handleShareWithSeller = async (inquiry) => {
    if (window.confirm(`Share this lead with ${inquiry.seller_name}? It will appear in their dashboard.`)) {
      setSubmitting(inquiry.id);
      try {
        const res = await shareLeadWithSellerAdmin(inquiry.id);
        if (res.success) {
          notifySuccess("Lead shared with seller!");
          setInquiries(prev => prev.map(i => i.id === inquiry.id ? { ...i, is_assigned: 1 } : i));
        }
      } catch (err) {
        notifyError("Failed to share lead");
      } finally {
        setSubmitting(null);
      }
    }
  };

  const handleWhatsAppForward = (inquiry) => {
    const lines = [
      `🔔 *New Lead Alert from PackagingBazaar!*`,
      ``,
      `📦 *Product:* ${inquiry.product_name}`,
      inquiry.quantity_required ? `📊 *Quantity:* ${inquiry.quantity_required}` : null,
      inquiry.thickness         ? `📏 *Thickness (Micron):* ${inquiry.thickness}` : null,
      inquiry.width             ? `📐 *Width:* ${inquiry.width}` : null,
      ``,
      `📍 *Buyer Location:*`,
      inquiry.city    ? `   • City: ${inquiry.city}` : null,
      inquiry.state   ? `   • State: ${inquiry.state}` : null,
      inquiry.pincode ? `   • Pincode: ${inquiry.pincode}` : null,
      inquiry.address ? `   • Address: ${inquiry.address}` : null,
      inquiry.message ? `\n💬 *Requirement:* ${inquiry.message}` : null,
      ``,
      `— PackagingBazaar Admin`
    ].filter(Boolean).join('\n');
    const url = `https://wa.me/?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank');
  };

  if (loading && inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-gray-100 min-h-[400px]">
        <RefreshCcw className="animate-spin text-accent mb-4" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <h1 className="font-syne font-black text-3xl text-gray-900 uppercase tracking-tight">
              Business Leads
            </h1>
          </div>
          <p className="text-gray-500 text-sm font-medium">Tracking all buyer inquiries and procurement requests.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              setExporting(true);
              try {
                await downloadExport("leads");
                notifySuccess("Leads report downloaded!");
              } catch (err) {
                notifyError("Failed to download leads report");
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:translate-y-[-2px] hover:shadow-xl active:translate-y-0 transition-all duration-300 disabled:opacity-50 group shadow-lg shadow-black/10"
          >
            {exporting ? (
              <RefreshCcw size={14} className="animate-spin" />
            ) : (
              <Save size={14} className="group-hover:scale-110 transition-transform" />
            )}
            <span>Download Reports</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full mb-8">
        {/* Filters on Left */}
        <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm">
          <div className="pl-3 pr-1 text-gray-400">
            <Filter size={16} />
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
            className="bg-transparent border-none text-[11px] font-bold text-gray-600 outline-none py-2 pr-4 cursor-pointer"
          >
            <option value="">Any Status</option>
            <option value="pending">New/Pending</option>
            <option value="Contacted">Contacted</option>
            <option value="Negotiating">Negotiating</option>
            <option value="Closed">Closed</option>
            <option value="Lost">Lost</option>
          </select>
          <div className="w-px h-4 bg-gray-100" />
          <select
            value={filters.product}
            onChange={(e) => handleFilterChange({ ...filters, product: e.target.value })}
            className="bg-transparent border-none text-[11px] font-bold text-gray-600 outline-none py-2 pr-4 cursor-pointer max-w-[150px]"
          >
            <option value="">All Products</option>
            {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filters.status || filters.product) && (
            <button 
              onClick={() => handleFilterChange({ status: "", product: "" })}
              className="text-[10px] font-black uppercase text-accent hover:underline px-3 border-l border-gray-100"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search on Right */}
        <div className="relative group w-full xl:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm w-full outline-none focus:border-accent shadow-sm"
          />
        </div>
      </div>

      {/* Content: Card Grid */}
      <div className="space-y-6">
        {filteredInquiries.length === 0 ? (
          <div className="bg-white rounded-[3rem] border border-gray-100 py-32 text-center shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-gray-200">
                <TrendingUp size={40} />
              </div>
              <div>
                <h3 className="font-syne font-black text-xl text-gray-300 uppercase tracking-wide">No Inquiries Found</h3>
                <p className="text-gray-400 text-xs font-medium">Try adjusting your filters or search terms.</p>
              </div>
            </div>
          </div>
        ) : (
          filteredInquiries.map((inquiry) => {
            const isExpanded = !!expandedLeads[inquiry.id];
            return (
              <div 
                key={inquiry.id} 
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden group"
              >
                <div className="p-5 md:p-6">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
                    
                    {/* Column 1: Buyer Info & Lead ID */}
                    <div className="xl:col-span-3">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="bg-accent/15 text-accent text-[9px] font-black uppercase px-2.5 py-1 rounded-xl border border-accent/20 tracking-wider shrink-0 shadow-sm shadow-accent/5">
                          LID-{inquiry.id}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                        <h3 className="font-syne font-black text-sm text-gray-900 leading-tight uppercase tracking-tight truncate max-w-[140px]" title={inquiry.buyer_name || inquiry.buyer_display_name}>
                          {inquiry.buyer_name || inquiry.buyer_display_name}
                        </h3>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest pl-2">
                        {new Date(inquiry.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {new Date(inquiry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Column 2: Material Requirement & Badges */}
                    <div className="xl:col-span-4 pl-0 xl:pl-4 xl:border-l border-gray-50 flex flex-col justify-center">
                      <h4 className="text-xs font-bold text-gray-800 leading-tight truncate mb-1.5" title={inquiry.product_name}>
                        {inquiry.product_name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {inquiry.quantity_required && inquiry.quantity_required !== 'Not specified' && (
                          <span className="bg-black text-white text-[8px] font-black uppercase px-2 py-0.5 rounded">
                            Qty: {inquiry.quantity_required}
                          </span>
                        )}
                        {inquiry.thickness && (
                          <span className="bg-slate-100 text-gray-600 text-[8px] font-black px-2 py-0.5 rounded border border-gray-200">
                            {inquiry.thickness} mic
                          </span>
                        )}
                        {inquiry.width && (
                          <span className="bg-slate-100 text-gray-600 text-[8px] font-black px-2 py-0.5 rounded border border-gray-200">
                            {inquiry.width} wide
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Process Status Dropdown */}
                    <div className="xl:col-span-2 pl-0 xl:pl-4 xl:border-l border-gray-50">
                      <select 
                        disabled={submitting === inquiry.id}
                        value={inquiry.status || 'pending'}
                        onChange={(e) => handleStatusClick(inquiry, e.target.value)}
                        className={`w-full text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-xl border outline-none transition-all cursor-pointer ${
                          submitting === inquiry.id ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          inquiry.status === 'Closed' ? 'bg-green-50 border-green-100 text-green-600' :
                          inquiry.status === 'Lost' ? 'bg-red-50 border-red-100 text-red-600' :
                          inquiry.status === 'pending' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                          'bg-blue-50 border-blue-100 text-blue-600'
                        }`}
                      >
                        <option value="pending">New/Pending</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Negotiating">Negotiating</option>
                        <option value="Closed">Deal Closed</option>
                        <option value="Lost">Deal Lost</option>
                      </select>
                    </div>

                    {/* Column 4: Quick Actions & Chevron Expander */}
                    <div className="xl:col-span-3 flex items-center justify-end gap-1.5 pl-0 xl:pl-4 xl:border-l border-gray-50">
                      <button 
                        onClick={() => setSelectedLead({ 
                          type: "lead", 
                          id: inquiry.id, 
                          name: `MATCHING FOR: ${inquiry.product_name}`, 
                          mode: "lead-matching",
                          pincode: inquiry.pincode,
                          inquiryData: inquiry
                        })}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-accent hover:bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-wider transition-all shadow-sm shrink-0"
                        title="Smart Match Sellers"
                      >
                        <Zap size={10} />
                        <span>Match</span>
                      </button>

                      <button 
                        onClick={() => handleWhatsAppForward(inquiry)}
                        className="flex items-center justify-center w-8 h-8 bg-white text-green-600 border border-green-100 rounded-xl hover:bg-green-50 transition-all shadow-sm shrink-0"
                        title="Forward to WhatsApp"
                      >
                        <Send size={11} />
                      </button>

                      <button 
                        onClick={() => toggleExpandLead(inquiry.id)}
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                          isExpanded ? 'border-accent text-accent bg-orange-50/50' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                        title={isExpanded ? "Collapse Details" : "View More Details"}
                      >
                        <ChevronDown 
                          size={14} 
                          className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} 
                        />
                      </button>
                    </div>

                  </div>

                  {/* Collapsible Details Panel */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-gray-50 mt-4 pt-4 space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Contact & Location Details */}
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-100/50 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Contact Info</span>
                              <p className="text-xs font-bold text-gray-800">{inquiry.phone || inquiry.buyer_display_mobile}</p>
                              <p className="text-[10px] font-semibold text-gray-400 lowercase truncate">{inquiry.buyer_email || inquiry.buyer_display_email}</p>
                            </div>
                            <div>
                              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Buyer Location</span>
                              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">
                                {inquiry.city}, {inquiry.state}
                              </p>
                              <p className="text-[9px] text-gray-400 font-medium">Pincode: {inquiry.pincode || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Buyer Message Requirement Description */}
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Detailed Requirement message</span>
                          {inquiry.message ? (
                            <div className="bg-orange-50/20 p-3 rounded-xl border border-orange-100/20 italic text-gray-600 text-xs leading-relaxed relative">
                              <MessageCircle size={12} className="absolute -top-1.5 -left-1.5 text-accent/20" />
                              "{inquiry.message}"
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No custom message specified by buyer.</p>
                          )}
                        </div>

                      </div>

                      {/* Assigned Sellers Progress Tracking */}
                      {inquiry.assigned_sellers && inquiry.assigned_sellers.length > 0 && (
                        <div className="px-4 py-2.5 bg-gray-50/30 rounded-xl border border-dashed border-gray-200 flex flex-wrap items-center gap-2">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mr-1.5 flex items-center gap-1">
                            <Zap size={9} className="text-accent" />
                            Assignments:
                          </span>
                          {inquiry.assigned_sellers.map((as, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg px-2.5 py-1 shadow-sm">
                              <span className="text-[9px] font-black text-gray-700 uppercase truncate max-w-[100px]">{as.company_name}</span>
                              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
                                as.status === 'fulfilled' ? 'bg-green-600 text-white shadow-sm' :
                                as.status === 'accepted' ? 'bg-blue-600 text-white shadow-sm' :
                                as.status === 'rejected' ? 'bg-red-600 text-white shadow-sm' :
                                as.status === 'pending' ? 'bg-orange-500 text-white shadow-sm' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                {as.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer Section: Notes & Won Info */}
                      <div className="pt-3 border-t border-gray-50 flex flex-col md:flex-row items-center gap-3">
                        <div className="flex-1 w-full flex items-center gap-2">
                          <div className="bg-slate-50 px-2 py-0.5 rounded border border-gray-100 shrink-0">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Note</span>
                          </div>
                          <textarea 
                            disabled={submitting === inquiry.id}
                            defaultValue={inquiry.admin_notes || ""}
                            onBlur={(e) => handleNotesChange(inquiry.id, e.target.value)}
                            placeholder={submitting === inquiry.id ? "Saving..." : "Add private note..."}
                            className={`flex-1 text-[10px] font-medium text-gray-600 px-3 py-1 rounded-lg border border-gray-100 bg-slate-50/20 outline-none focus:border-accent focus:bg-white transition-all h-7 resize-none flex items-center ${submitting === inquiry.id ? 'opacity-50' : ''}`}
                          />
                        </div>
                        
                        {inquiry.status === 'Closed' ? (
                          <div className="w-full md:w-auto flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg border border-green-100 shrink-0">
                            <span className="text-[7px] font-black text-green-600 uppercase tracking-widest leading-none">Winner</span>
                            <p className="text-[9px] font-black text-green-700 max-w-[120px] truncate">{inquiry.won_seller_name || 'Seller Selected'}</p>
                          </div>
                        ) : inquiry.status === 'Lost' ? (
                          <div className="w-full md:w-auto flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg border border-red-100 shrink-0">
                            <span className="text-[7px] font-black text-red-600 uppercase tracking-widest leading-none">Reason</span>
                            <p className="text-[9px] font-black text-red-700 max-w-[120px] truncate">{inquiry.lost_reason}</p>
                          </div>
                        ) : (
                          <div className="w-full md:w-auto flex items-center gap-2 px-3 py-1 bg-slate-50/30 rounded-lg border border-gray-50 shrink-0">
                            <div className="flex flex-col">
                              <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none">Primary Seller</span>
                              <p className="text-[9px] font-black text-gray-800 max-w-[120px] truncate">{inquiry.seller_name}</p>
                            </div>
                            <div className="w-px h-3 bg-gray-200" />
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">{inquiry.seller_city}</p>
                          </div>
                        )}
                      </div>

                    </motion.div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Status Update Modal */}
      {statusModal.open && (
        <StatusModal 
          modal={statusModal} 
          onClose={() => setStatusModal({ open: false, inquiry: null, status: "", sellers: [] })} 
          onConfirm={handleStatusChange}
          submitting={submitting === statusModal.inquiry?.id}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => loadInquiries(page, search, filters)}
          />
        </div>
      )}

      {selectedLead && (
        <SubViewOverlay
          entity={selectedLead}
          onClose={() => setSelectedLead(null)}
          notifyError={notifyError}
        />
      )}
    </div>
  );
}

function StatusModal({ modal, onClose, onConfirm }) {
  const [winnerId, setWinnerId] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = () => {
    const extra = {};
    if (modal.status === 'Closed') {
      if (!winnerId) return alert("Please select a winner!");
      extra.wonSellerId = winnerId;
    } else if (modal.status === 'Lost') {
      const finalReason = lostReason === 'Other' ? customReason : lostReason;
      if (!finalReason) return alert("Please provide a reason!");
      extra.lostReason = finalReason;
    }
    onConfirm(modal.inquiry.id, modal.status, extra);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative animate-scaleIn">
        <div className="flex items-center gap-4 mb-8">
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${modal.status === 'Closed' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
              {modal.status === 'Closed' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
           </div>
           <div>
             <h3 className="font-syne font-black text-2xl text-gray-900 uppercase tracking-tight">Mark as {modal.status === 'Closed' ? 'Deal Closed' : 'Lead Lost'}</h3>
             <p className="text-sm text-gray-400 font-medium">LID-{modal.inquiry.id} • {modal.inquiry.product_name}</p>
           </div>
        </div>

        {modal.status === 'Closed' && (
          <div className="space-y-6 mb-8">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Which seller won this deal?</label>
              {modal.sellers.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {modal.sellers.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => setWinnerId(s.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${winnerId === s.id ? 'border-green-500 bg-green-50' : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'}`}
                    >
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase">{s.company_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-gray-400 font-bold">{s.phone}</p>
                          {s.status && (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                              s.status === 'fulfilled' ? 'bg-green-100 text-green-600' :
                              s.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-500'
                            }`}>{s.status}</span>
                          )}
                        </div>
                      </div>
                      {winnerId === s.id && <CheckCircle2 size={18} className="text-green-500" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-[11px] font-bold text-orange-600">
                  No sellers have been assigned to this lead yet via Dashboard. Please assign sellers first or skip winner selection.
                  <button onClick={() => setWinnerId("0")} className="block mt-2 underline">Skip Winner Selection</button>
                </div>
              )}
            </div>
          </div>
        )}

        {modal.status === 'Lost' && (
          <div className="space-y-6 mb-8">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Why was this lead lost?</label>
              <select 
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-accent text-sm font-bold text-gray-700"
              >
                <option value="">Select a reason...</option>
                <option value="Price Too High">Price Too High</option>
                <option value="Product Not Available">Product Not Available</option>
                <option value="Delayed Response">Delayed Response</option>
                <option value="Buyer Cancelled">Buyer Cancelled</option>
                <option value="MOQ Not Matching">MOQ Not Matching</option>
                <option value="Other">Other (Type below)</option>
              </select>
            </div>
            {lostReason === 'Other' && (
              <textarea 
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Type the specific reason..."
                className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none focus:border-accent text-sm font-medium h-24 resize-none"
              />
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl text-xs font-black uppercase text-gray-400 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={modal.submitting}
            onClick={handleConfirm}
            className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase text-white shadow-lg transition-all flex items-center justify-center gap-2 ${modal.status === 'Closed' ? 'bg-green-500 hover:bg-green-600 shadow-green-100' : 'bg-red-500 hover:bg-red-600 shadow-red-100'} disabled:opacity-50`}
          >
            {modal.submitting ? <RefreshCcw size={14} className="animate-spin" /> : null}
            {modal.submitting ? "Updating..." : `Confirm ${modal.status === 'Closed' ? 'Success' : 'Lost'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
