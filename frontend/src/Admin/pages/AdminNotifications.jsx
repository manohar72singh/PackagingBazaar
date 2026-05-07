import React, { useState, useEffect } from "react";
import { 
  Bell, Trash2, CheckCircle2, Filter, 
  Search, ArrowRight, MessageSquare, UserPlus, 
  ChevronLeft, ChevronRight, Square, CheckSquare
} from "lucide-react";
import { API_BASE_URL } from "../../services/api";
import { toast } from "react-hot-toast";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [page]); // Re-fetch on page change

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/notifications?all=true&page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/notifications/mark-as-read/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (id === "all" || n.id === id ? { ...n, is_read: 1 } : n))
        );
        if (id === "all") toast.success("All marked as read");
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDelete = async (ids) => {
    if (!window.confirm(`Are you sure you want to delete ${ids.length} notification(s)?`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/notifications/bulk-delete`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Deleted successfully");
        setSelectedIds([]);
        fetchNotifications();
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'lead': return <MessageSquare size={18} className="text-orange-600" />;
      case 'registration': return <UserPlus size={18} className="text-blue-600" />;
      default: return <Bell size={18} className="text-gray-600" />;
    }
  };

  // Local filter for search (since backend doesn't search yet)
  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === 'all' || n.type === filter;
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">History & Archive</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Total {totalCount} records found</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button 
              onClick={() => handleDelete(selectedIds)}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
            >
              <Trash2 size={16} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => markAsRead("all")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10"
          >
            <CheckCircle2 size={16} /> Mark All Read
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full flex items-center gap-3">
          <button 
            onClick={toggleSelectAll}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            {selectedIds.length === notifications.length && notifications.length > 0 ? <CheckSquare className="text-blue-600" /> : <Square />}
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
          </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          {['all', 'lead', 'registration'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === 'registration' ? 'Sellers' : f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3 mb-8">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />
          ))
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-gray-100">
            <Bell size={60} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold">No records found.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div 
              key={n.id}
              className={`group bg-white p-5 rounded-2xl border transition-all hover:border-blue-200 flex items-start gap-4 ${
                selectedIds.includes(n.id) ? "border-blue-500 bg-blue-50/30" : "border-gray-50"
              } ${!n.is_read ? "border-l-4 border-l-blue-500" : ""}`}
            >
              <button 
                onClick={() => toggleSelect(n.id)}
                className="mt-3 text-gray-300 hover:text-blue-500 transition-colors"
              >
                {selectedIds.includes(n.id) ? <CheckSquare className="text-blue-600" /> : <Square />}
              </button>

              <div className={`p-3 rounded-xl shrink-0 ${
                n.type === 'lead' ? 'bg-orange-100' : 
                n.type === 'registration' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {getIcon(n.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-sm font-black truncate ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                    {n.title}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-4">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-medium mb-3">
                  {n.message}
                </p>
                
                {n.link && (
                  <a 
                    href={n.link}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:gap-2 transition-all"
                  >
                    View Details <ArrowRight size={12} />
                  </a>
                )}
              </div>

              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                {!n.is_read && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Mark as Read"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                )}
                <button 
                  onClick={() => handleDelete([n.id])}
                  className="p-2 text-gray-400 hover:text-red-500"
                  title="Delete Permanently"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-6">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                  page === i + 1 ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white text-gray-600 border border-gray-100 hover:border-blue-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
