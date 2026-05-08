import React, { useState, useEffect } from "react";
import { 
  Clock, 
  Search, 
  CheckCircle2, 
  XCircle,
  FileText,
  RefreshCcw
} from "lucide-react";
import { 
  fetchPendingSellers, 
  updateSellerStatus, 
  rejectSellerAccount 
} from "../../services/adminServices";
import { useNotification } from "../../context/NotificationContext";
import { API_BASE_URL } from "../../services/api";
import Pagination from "../../components/ui/Pagination";

const inputCls = "w-full px-4 py-2.5 text-sm border border-black/[0.1] rounded-xl bg-slate-50 focus:outline-none focus:bg-white focus:border-accent transition-colors text-ink placeholder:text-slate-400 font-medium";

export default function AdminPendingSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const { notifySuccess, notifyError } = useNotification();

  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    userId: null,
    newStatus: "",
    message: "",
    mobile: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSellers(1);
  }, []);

  const loadSellers = async (page) => {
    setLoading(true);
    try {
      const res = await fetchPendingSellers(page);
      if (res.success) {
        setSellers(res.sellers);
        setTotalPages(res.totalPages || 1);
        setCurrentPage(res.currentPage || 1);
      }
    } catch (err) {
      notifyError("Failed to load pending sellers");
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter((item) => {
    const s = search.toLowerCase();
    return (
      item.company_name?.toLowerCase().includes(s) ||
      item.owner_name?.toLowerCase().includes(s)
    );
  });

  if (loading && sellers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-gray-100 min-h-[400px]">
        <RefreshCcw className="animate-spin text-accent mb-4" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <h1 className="font-syne font-black text-3xl text-gray-900 uppercase tracking-tight">
              Pending Approvals
            </h1>
          </div>
          <p className="text-gray-500 text-sm font-medium">Review and verify new seller applications before they go live.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search pending sellers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm w-full md:w-80 outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase">Company</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase">Business</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase">Location</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Clock size={48} className="text-gray-200" />
                      <p className="font-syne font-black text-lg text-gray-300 uppercase tracking-wide">No Pending Applications</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller) => (
                  <tr key={seller.user_id} className="hover:bg-gray-50/50 transition-all border-b border-gray-50">
                    <td className="px-8 py-6">
                      <div className="font-bold text-gray-900 leading-tight">{seller.company_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-[10px] text-gray-400 font-bold uppercase">UID: {seller.seller_uid}</div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="w-fit px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase">
                          {seller.business_type}
                        </span>
                        <span className={`w-fit px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${seller.status === "hold" ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-slate-50 text-slate-500 border-slate-100"}`}>
                          {seller.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs text-gray-600 font-bold">
                      {seller.city}, {seller.state}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {seller.gst_certificate && (
                           <a
                           href={seller.gst_certificate.startsWith("http") ? seller.gst_certificate : `${API_BASE_URL.replace("/api", "")}/${seller.gst_certificate}`}
                           target="_blank"
                           rel="noreferrer"
                           className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 shadow-sm"
                           title="View GST"
                         >
                           <FileText size={16} />
                         </a>
                        )}
                        <button
                          onClick={() => setStatusModal({
                            isOpen: true,
                            userId: seller.user_id,
                            newStatus: "verified",
                            message: `Hi ${seller.company_name}, your account on PackagingBazaar is now VERIFIED! Log in to list your products.`,
                            mobile: seller.mobile,
                          })}
                          className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 shadow-sm"
                          title="Verify"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        {seller.status !== "hold" && (
                          <button
                            onClick={() => setStatusModal({
                              isOpen: true,
                              userId: seller.user_id,
                              newStatus: "hold",
                              message: `Hi ${seller.company_name}, your application is currently on HOLD. Please provide [REASON].`,
                              mobile: seller.mobile,
                            })}
                            className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 shadow-sm"
                            title="Put on Hold"
                          >
                            <Clock size={16} />
                          </button>
                        )}
                         <button
                          onClick={() => setStatusModal({
                            isOpen: true,
                            userId: seller.user_id,
                            newStatus: "rejected",
                            message: `Hi ${seller.company_name}, we regret to inform you that your application has been DECLINED. Reason: [REASON]`,
                            mobile: seller.mobile,
                          })}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 shadow-sm"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-8 bg-slate-50/30 border-t border-gray-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => loadSellers(page)}
            />
          </div>
        )}
      </div>

      {statusModal.isOpen && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
          <div onClick={() => setStatusModal({ ...statusModal, isOpen: false })} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[2.5rem] p-8 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                statusModal.newStatus === 'verified' ? 'bg-green-100 text-green-600' :
                statusModal.newStatus === 'hold' ? 'bg-orange-100 text-orange-600' :
                'bg-red-100 text-red-600'
              }`}>
                {statusModal.newStatus === 'verified' ? <CheckCircle2 size={24} /> :
                 statusModal.newStatus === 'hold' ? <Clock size={24} /> :
                 <XCircle size={24} />
                }
              </div>
              <h3 className="text-2xl font-black font-syne capitalize">{statusModal.newStatus} Seller</h3>
            </div>

            <textarea
              value={statusModal.message}
              onChange={(e) => setStatusModal({ ...statusModal, message: e.target.value })}
              className={inputCls + " h-32 mb-6"}
              placeholder="Enter message for WhatsApp & Email..."
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
                className="flex-1 px-8 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-xs"
              >
                Cancel
              </button>
              <button 
                disabled={submitting}
                onClick={async () => {
                  const { userId, newStatus, message, mobile } = statusModal;
                  if (!message) return notifyError("Please enter a status message");
                  setSubmitting(true);
                  try {
                    let res;
                    if (newStatus === "rejected") {
                      if (!window.confirm("Are you sure you want to PERMANENTLY decline and delete this seller?")) {
                        setSubmitting(false);
                        return;
                      }
                      res = await rejectSellerAccount(userId);
                    } else {
                      res = await updateSellerStatus(userId, newStatus);
                    }

                    if (res.success) {
                      notifySuccess(`Seller updated: ${newStatus}`);
                      setStatusModal({ ...statusModal, isOpen: false });
                      window.open(
                        `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`,
                        "_blank",
                      );
                      loadSellers(currentPage);
                    }
                  } catch (err) {
                    notifyError("Failed to update status");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className={`flex-[2] px-8 py-4 text-white rounded-2xl font-black uppercase text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 ${
                  statusModal.newStatus === 'verified' ? 'bg-green-600 shadow-green-200' :
                  statusModal.newStatus === 'hold' ? 'bg-orange-500 shadow-orange-200' :
                  'bg-red-600 shadow-red-200'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCcw size={16} className="animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm & Notify"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
