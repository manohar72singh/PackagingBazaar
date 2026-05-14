import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Filter, 
  Search,
  RefreshCcw,
  User,
  Package,
  MapPin,
  ArrowRight
} from "lucide-react";
import { fetchLeadAssignmentStats } from "../../services/adminServices";
import { useNotification } from "../../context/NotificationContext";
import { motion } from "framer-motion";

export default function AdminLeadAnalytics() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ status: "", sellerId: "" });
  const [search, setSearch] = useState("");

  const { notifyError } = useNotification();

  useEffect(() => {
    loadData();
  }, [page, filters.status]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchLeadAssignmentStats(page, 10, filters.status);
      if (res.success) {
        setData(res.data);
        setStats(res.stats);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      notifyError("Failed to load conversion stats");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (data.length === 0) return;

    const headers = [
      "Assignment ID", "Lead ID", "Buyer Name", "Buyer Phone", "Buyer City", 
      "Product", "Seller Name", "Seller Mobile", "Seller UID", 
      "Status", "Assigned At", "Seller Notes"
    ];

    const rows = data.map(item => {
      const row = [
        item.id,
        `PB-LID-${item.inquiry_id}`,
        item.buyer_name,
        item.buyer_phone || "N/A",
        item.buyer_city,
        item.product_name,
        item.seller_name,
        item.seller_mobile || "N/A",
        item.seller_uid,
        item.assignment_status.toUpperCase(),
        new Date(item.assigned_at).toLocaleString().replace(/,/g, ''),
        item.seller_notes || "N/A"
      ];
      return row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [
      headers.join(","),
      ...rows
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Conversion_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = data.filter(item => 
    item.seller_name.toLowerCase().includes(search.toLowerCase()) ||
    item.product_name.toLowerCase().includes(search.toLowerCase()) ||
    item.buyer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <h1 className="font-syne font-black text-3xl text-gray-900 uppercase tracking-tight">
              Conversion Hub
            </h1>
          </div>
          <p className="text-gray-500 text-sm font-medium">Monitoring lead-to-business fulfillment performance.</p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10"
        >
          <Download size={14} />
          Download Conversion Sheet
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard 
          label="Total Leads" 
          value={stats.total_sent} 
          icon={<ArrowRight size={14} className="text-blue-500" />} 
          color="blue"
        />
        <StatCard 
          label="Fulfilled" 
          value={stats.total_fulfilled} 
          icon={<CheckCircle size={14} className="text-green-500" />} 
          color="green"
        />
        <StatCard 
          label="Conv. Rate" 
          value={`${stats.conversion_rate}%`} 
          icon={<TrendingUp size={14} className="text-indigo-500" />} 
          color="indigo"
        />
        <StatCard 
          label="Rejected" 
          value={stats.total_rejected} 
          icon={<XCircle size={14} className="text-red-500" />} 
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text"
            placeholder="Search Seller, Buyer, Product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
             value={filters.status}
             onChange={(e) => setFilters({ ...filters, status: e.target.value })}
             className="bg-gray-50 border-none text-[10px] font-black uppercase text-gray-600 py-2 px-3 rounded-xl outline-none"
           >
             <option value="">Status</option>
             <option value="pending">Pending</option>
             <option value="accepted">Accepted</option>
             <option value="fulfilled">Fulfilled</option>
             <option value="rejected">Rejected</option>
           </select>
          
          <button 
            onClick={loadData}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-transparent">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="px-5 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Lead / Product</th>
                <th className="px-5 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Seller</th>
                <th className="px-5 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-5 py-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-5 py-6 bg-white rounded-2xl" />
                  </tr>
                ))
              ) : filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    key={item.id} 
                    className="bg-white hover:bg-indigo-50/30 transition-all group shadow-sm"
                  >
                    <td className="px-5 py-3 rounded-l-xl border-y border-l border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gray-50 text-gray-400 group-hover:text-indigo-600 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                          <Package size={16} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-gray-900 uppercase leading-none">PB-LID-{item.inquiry_id}</div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase mt-1 leading-none">{item.buyer_name} • {item.buyer_phone}</div>
                          <div className="text-[9px] font-bold text-indigo-600 uppercase mt-1 leading-none">{item.product_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 border-y border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-gray-800 uppercase leading-none">{item.seller_name}</div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase mt-1 leading-none">UID: {item.seller_uid} • {item.seller_mobile}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 border-y border-gray-100">
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border inline-block ${
                        item.assignment_status === 'fulfilled' ? 'bg-green-600 text-white border-green-700' :
                        item.assignment_status === 'rejected'  ? 'bg-red-600 text-white border-red-700' :
                        item.assignment_status === 'accepted'  ? 'bg-blue-600 text-white border-blue-700' :
                        'bg-orange-500 text-white border-orange-600'
                      }`}>
                        {item.assignment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3 border-y border-gray-100">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase">
                        <Clock size={10} />
                        {new Date(item.assigned_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right rounded-r-xl border-y border-r border-gray-100">
                       <p className="text-[9px] text-gray-500 italic max-w-[150px] ml-auto truncate">
                         {item.seller_notes || "—"}
                       </p>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <p className="text-sm text-gray-400 font-medium italic">No assignments matching the filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                  page === i + 1 ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-gray-400 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100",
    green: "bg-green-50 border-green-100",
    indigo: "bg-indigo-50 border-indigo-100",
    red: "bg-red-50 border-red-100"
  };

  return (
    <div className={`p-4 rounded-2xl border ${colors[color]} shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>
      <div className="text-xl font-black text-gray-900">{value}</div>
      <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}
