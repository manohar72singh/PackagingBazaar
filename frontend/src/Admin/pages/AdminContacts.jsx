import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Search, 
  RefreshCcw,
  MessageSquare,
  CheckCircle,
  Clock,
  Filter,
  Phone,
  ArrowUpRight,
  User,
  Building2,
  Calendar
} from "lucide-react";
import { fetchAllContactMessages, updateContactMessageStatus } from "../../services/contactServices";
import { useNotification } from "../../context/NotificationContext";

export default function AdminContacts() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    subject: ""
  });
  const { notifyError, notifySuccess } = useNotification();

  const subjects = [...new Set(messages.map(m => m.subject))].filter(Boolean);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await fetchAllContactMessages();
      if (res.success) {
        setMessages(res.data);
      }
    } catch (err) {
      notifyError("Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter((item) => {
    const s = search.toLowerCase();
    const matchesSearch = (
      item.name?.toLowerCase().includes(s) ||
      item.email?.toLowerCase().includes(s) ||
      item.company_name?.toLowerCase().includes(s) ||
      item.subject?.toLowerCase().includes(s)
    );

    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesSubject = !filters.subject || item.subject === filters.subject;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateContactMessageStatus(id, newStatus);
      if (res.success) {
        notifySuccess("Status updated!");
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
      }
    } catch (err) {
      notifyError("Failed to update status");
    }
  };

  const stats = {
    total: messages.length,
    pending: messages.filter(m => m.status === 'pending').length,
    replied: messages.filter(m => m.status === 'replied').length
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-gray-100 min-h-[400px]">
        <RefreshCcw className="animate-spin text-accent mb-4" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn pb-10">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
              <Mail size={28} />
            </div>
            <h1 className="font-syne font-black text-4xl text-gray-900 uppercase tracking-tight">
              Contact Inquiries
            </h1>
          </div>
          <p className="text-gray-500 text-sm font-medium ml-1">Managing and responding to messages from the website.</p>
        </div>

        <div className="flex gap-4">
          {[
            { label: 'Total', count: stats.total, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: 'Pending', count: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Replied', count: stats.replied, color: 'text-emerald-600', bg: 'bg-emerald-50' }
          ].map(s => (
            <div key={s.label} className={`${s.bg} px-6 py-4 rounded-3xl border border-black/5 flex flex-col items-center min-w-[100px]`}>
              <span className={`text-2xl font-black ${s.color}`}>{s.count}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 mb-8 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
            <Filter size={14} className="text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="bg-transparent border-none text-[11px] font-bold text-gray-600 outline-none pr-4 cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
            <MessageSquare size={14} className="text-gray-400" />
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="bg-transparent border-none text-[11px] font-bold text-gray-600 outline-none pr-4 cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>

          {(filters.status || filters.subject) && (
            <button 
              onClick={() => setFilters({ status: "", subject: "" })}
              className="text-[10px] font-black uppercase text-accent hover:underline px-3"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group flex-1 xl:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search sender, email, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm w-full outline-none focus:border-accent transition-all"
            />
          </div>
          <button 
            onClick={loadMessages}
            className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 hover:text-accent transition-all"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      {/* Inquiries Grid - Single Column List */}
      {filteredMessages.length === 0 ? (
        <div className="bg-white rounded-[3rem] py-24 text-center border border-gray-100">
          <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
              <MessageSquare size={40} className="text-gray-200" />
            </div>
            <h3 className="font-syne font-black text-xl text-gray-400 uppercase tracking-widest">No Inquiries</h3>
            <p className="text-gray-400 text-sm">We couldn't find any messages matching your current filters.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredMessages.map((msg) => (
            <div 
              key={msg.id} 
              className="group bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/20 transition-all duration-300 relative overflow-hidden"
            >
              {/* Left Indicator */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${msg.status === 'pending' ? 'bg-amber-400' : 'bg-emerald-400'}`} />

              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* 1. Sender Info (Fixed Width) */}
                <div className="flex items-center gap-4 lg:w-72 shrink-0">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <User size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-syne font-bold text-base text-gray-900 truncate">{msg.name}</h3>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex items-center gap-1 mb-0.5">
                      <Building2 size={10} /> {msg.company_name || 'Personal'}
                    </div>
                    <div className="text-[10px] text-accent font-medium truncate mb-0.5">
                      {msg.email}
                    </div>
                    {msg.phone && (
                      <div className="text-[10px] text-gray-400 font-bold">
                        {msg.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Message Content (Flexible) */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="px-2.5 py-0.5 bg-accent/5 text-accent text-[9px] font-black uppercase rounded-full border border-accent/10">
                      {msg.subject || "General"}
                    </span>
                    <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={10} /> {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 italic leading-relaxed">
                    "{msg.message}"
                  </p>
                </div>

                {/* 3. Actions & Status (Fixed Width) */}
                <div className="flex items-center gap-4 lg:w-80 justify-between lg:justify-end shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-gray-50">
                  <div className="flex gap-1.5">
                    <a 
                      href={`mailto:${msg.email}`}
                      title={msg.email}
                      className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-accent transition-all shadow-sm"
                    >
                      <Mail size={16} />
                    </a>
                    {msg.phone && (
                      <a 
                        href={`tel:${msg.phone}`}
                        title={msg.phone}
                        className="p-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl hover:border-accent hover:text-accent transition-all shadow-sm"
                      >
                        <Phone size={16} />
                      </a>
                    )}
                  </div>

                  <select 
                    value={msg.status}
                    onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                    className={`text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl border outline-none cursor-pointer transition-all ${
                      msg.status === 'pending' 
                        ? 'bg-amber-50 text-amber-600 border-amber-100' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="replied">Replied</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
