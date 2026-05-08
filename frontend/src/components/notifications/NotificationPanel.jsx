import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { API_BASE_URL } from "../../services/api";
import { Bell, Check, Trash2, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

const NotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { unreadCount, setUnreadCount, fetchUnreadCount } = useSocket();
  const panelRef = useRef(null);

  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "lead") return n.type === "lead";
    if (activeFilter === "registration") return n.type === "registration";
    return true;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
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
        if (id === "all") setUnreadCount(0);
        else fetchUnreadCount();
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const dismissAll = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/notifications/dismiss-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success("Panel cleared");
      }
    } catch (error) {
      console.error("Error dismissing:", error);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors focus:outline-none"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">Notifications</h3>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={() => markAsRead("all")}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-black uppercase tracking-widest"
                    >
                      Read All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={dismissAll}
                      className="text-[10px] text-red-500 hover:text-red-700 font-black uppercase tracking-widest"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-1 bg-gray-200/50 p-1 rounded-lg">
              {['all', 'lead', 'registration'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`flex-1 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${
                    activeFilter === f 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f === 'registration' ? 'Sellers' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-10 text-center">
                <Bell className="mx-auto text-gray-200 mb-2" size={40} />
                <p className="text-gray-400 text-sm">No {activeFilter === 'all' ? '' : activeFilter} notifications</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer relative ${
                    !n.is_read ? "bg-blue-50/30" : ""
                  }`}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 p-2 rounded-lg ${
                      n.type === 'lead' ? 'bg-orange-100 text-orange-600' :
                      n.type === 'order' ? 'bg-green-100 text-green-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Bell size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm font-bold flex items-center gap-2 ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {n.title}
                          {n.notification_count > 1 && (
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {n.notification_count}
                            </span>
                          )}
                        </p>
                        {!n.is_read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-2">
                        {n.message}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                         <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                        {n.link && (
                          <a 
                            href={n.link} 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!n.is_read) markAsRead(n.id);
                            }}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1"
                          >
                            View Details <ArrowRight size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 text-center border-t border-gray-50 bg-gray-50/30">
             <Link 
               to="/admin/notifications" 
               onClick={() => setIsOpen(false)}
               className="text-xs text-gray-500 hover:text-gray-700 font-bold uppercase tracking-widest"
             >
               View All History
             </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
