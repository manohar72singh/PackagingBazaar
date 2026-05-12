import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  MapPin as MapPinIcon,
  XCircle,
  RefreshCcw 
} from "lucide-react";
import { fetchAllUsers, deleteUserAccount, downloadExport } from "../../services/adminServices";
import { useNotification } from "../../context/NotificationContext";
import Pagination from "../../components/ui/Pagination";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("user");
  const { notifyError, notifySuccess } = useNotification();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadUsers(1);
  }, [userRoleFilter]);

  const loadUsers = async (page) => {
    setLoading(true);
    try {
      const res = await fetchAllUsers(page, 10, userRoleFilter);
      if (res.success) {
        setUsers(res.users);
        setTotalPages(res.totalPages || 1);
        setCurrentPage(res.currentPage || 1);
      }
    } catch (err) {
      notifyError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await deleteUserAccount(id);
        if (res.success) {
          notifySuccess("User deleted successfully");
          loadUsers(currentPage);
        }
      } catch (err) {
        notifyError("Failed to delete user");
      }
    }
  };

  const filteredUsers = users.filter((item) => {
    const s = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(s) ||
      item.email?.toLowerCase().includes(s) ||
      item.seller_uid?.toLowerCase().includes(s)
    );
  });

  if (loading && users.length === 0) {
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
              <Users size={24} />
            </div>
            <h1 className="font-syne font-black text-3xl text-gray-900 uppercase tracking-tight">
              User Directory
            </h1>
          </div>
          <p className="text-gray-500 text-sm font-medium">Manage buyer accounts and monitor user activity across the system.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={async () => {
              setExporting(true);
              try {
                await downloadExport("sellers");
                notifySuccess("Sellers report downloaded!");
              } catch (err) {
                notifyError("Failed to export sellers");
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:translate-y-[-2px] hover:shadow-xl transition-all duration-300 disabled:opacity-50 group shadow-sm"
          >
            {exporting ? (
              <RefreshCcw size={14} className="animate-spin" />
            ) : (
              <Users size={14} className="text-accent group-hover:scale-110 transition-transform" />
            )}
            <span>Export Sellers</span>
          </button>

          <button 
            onClick={async () => {
              setExporting(true);
              try {
                await downloadExport("inventory");
                notifySuccess("Inventory report downloaded!");
              } catch (err) {
                notifyError("Failed to export inventory");
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:translate-y-[-2px] hover:shadow-xl transition-all duration-300 disabled:opacity-50 group shadow-sm"
          >
            {exporting ? (
              <RefreshCcw size={14} className="animate-spin" />
            ) : (
              <RefreshCcw size={14} className="text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
            )}
            <span>Export Inventory</span>
          </button>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm w-full md:w-80 outline-none focus:border-accent shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 w-fit mb-6">
        <button
          onClick={() => setUserRoleFilter("user")}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${userRoleFilter === "user" ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-gray-400 hover:text-ink"}`}
        >
          All Users
        </button>
        <button
          onClick={() => setUserRoleFilter("seller")}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${userRoleFilter === "seller" ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-gray-400 hover:text-ink"}`}
        >
          Sellers
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase">User Info</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase">Business Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase">Contact</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={48} className="text-gray-200" />
                      <p className="font-syne font-black text-lg text-gray-300 uppercase tracking-wide">No Users Found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-all border-b border-gray-50 group">
                    <td className="px-8 py-6">
                      <div className="font-bold text-gray-900 group-hover:text-accent transition-colors text-sm">{user.name}</div>
                      <div className="text-[10px] text-gray-400 font-black uppercase mt-0.5">{user.role}</div>
                    </td>
                    <td className="px-8 py-6">
                      {user.role === 'seller' ? (
                        <>
                          <div className="text-xs font-black text-gray-800 uppercase tracking-tight">{user.company_name || "N/A"}</div>
                          <div className="text-[9px] text-accent font-bold uppercase tracking-widest mt-1">ID: {user.seller_uid || "PENDING"}</div>
                          {user.city && (
                            <div className="text-[9px] text-gray-400 font-bold mt-1 uppercase flex items-center gap-1">
                               <MapPinIcon size={10} /> {user.city}, {user.state}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-300 italic">Not a seller</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs font-medium flex items-center gap-2 mb-1">
                        <Mail size={12} className="text-gray-300" /> {user.email}
                      </div>
                      {user.mobile && (
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <Phone size={12} className="text-gray-300" /> {user.mobile}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={16} />
                      </button>
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
              onPageChange={(page) => loadUsers(page)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
