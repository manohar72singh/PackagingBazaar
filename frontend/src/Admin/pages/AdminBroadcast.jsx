import React, { useState } from "react";
import { 
  Megaphone, Send, Users, ShieldCheck, Info, 
  Mail, Bell, AlertCircle, CheckCircle2, 
  Globe, UserCheck, Store
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../services/api";

const AdminBroadcast = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    role: "all",
    type: "info",
    link: "",
    includeEmail: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      return toast.error("Title and message are required");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/notifications/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Broadcast started successfully");
        setFormData({ title: "", message: "", role: "all", type: "info", link: "", includeEmail: false });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to send broadcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-2">
      {/* Mini Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Megaphone size={24} className="text-blue-600" />
            Broadcast Center
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Direct Network Communication</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Real-time Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Audience & Type in one row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Audience</label>
                  <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                    {['all', 'seller', 'user'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role })}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          formData.role === role 
                          ? "bg-white text-blue-600 shadow-sm" 
                          : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {role.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notification Style</label>
                  <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                    {['info', 'success', 'warning'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type })}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          formData.type === type 
                          ? "bg-white text-gray-900 shadow-sm" 
                          : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title & Email Toggle */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alert Title</label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <span className="text-[10px] font-black text-gray-400 uppercase group-hover:text-gray-600">Include Email?</span>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.includeEmail ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={formData.includeEmail}
                        onChange={(e) => setFormData({ ...formData, includeEmail: e.target.checked })}
                      />
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${formData.includeEmail ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="e.g., Important Update for all Manufacturers"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-500 transition-all font-bold text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message Body</label>
                <textarea
                  rows="4"
                  placeholder="Type your announcement detail..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Action Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="/orders or https://..."
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-500 text-xs font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.message.trim()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  {loading ? "Sending..." : "Blast Notification"}
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info & Preview Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck size={60} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
              <Bell size={12} className="text-blue-500" /> Preview Mode
            </h4>
            
            <div className="bg-white/10 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
               <div className="flex gap-3">
                 <div className={`p-2 rounded-lg ${
                   formData.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                   formData.type === 'success' ? 'bg-green-500/20 text-green-500' :
                   'bg-blue-500/20 text-blue-500'
                 }`}>
                   <Bell size={16} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{formData.title || "Alert Title"}</p>
                    <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                      {formData.message || "Message will appear here..."}
                    </p>
                 </div>
               </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
               <div className="flex justify-between items-center text-[10px]">
                 <span className="text-gray-500 font-bold uppercase">Socket Signals</span>
                 <span className="text-green-500 font-black">ACTIVE</span>
               </div>
               <div className="flex justify-between items-center text-[10px]">
                 <span className="text-gray-500 font-bold uppercase">Email Status</span>
                 <span className={formData.includeEmail ? "text-green-500 font-black" : "text-gray-600 font-black"}>
                   {formData.includeEmail ? "READY" : "OFF"}
                 </span>
               </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
             <AlertCircle size={18} className="text-amber-600 shrink-0" />
             <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                <strong>Admin Tip:</strong> Broadcasting to 'All' sends alerts to 100% of your verified network. Use sparingly for maximum impact.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBroadcast;
