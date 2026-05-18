import { useState, useEffect } from "react";
import { User, Mail, ShieldCheck, Calendar, Edit3, Save, X, ArrowLeft, Settings, Bell, Lock, MapPin, Package, ClipboardList } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchUserProfile, updateUserProfileAPI } from "../services/userServices";
import AddressManager from "../components/profile/AddressManager";
import OrderHistory from "../components/profile/OrderHistory";
import InquiryHistory from "../components/profile/InquiryHistory";
import { useNotification } from "../context/NotificationContext";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile"); 
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await fetchUserProfile();
      if (res.success) {
        setUser(res.user);
        setNewName(res.user.name);
        setNewMobile(res.user.mobile || "");
      }
    } catch (err) {
      notifyError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    try {
      if (newMobile && !/^[0-9]{10}$/.test(newMobile)) {
        return notifyError("Mobile number must be 10 digits.");
      }
      await updateUserProfileAPI(newName, newMobile);
      notifySuccess("Profile updated successfully!");
      setEditing(false);
      loadUser();
      // If we used a global user state, we'd update it here too.
    } catch (err) {
      notifyError("Update failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest text-xs font-bold text-gray-400">
      <div className="animate-pulse">Loading Your Profile...</div>
    </div>
  );

  const initials = user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      
      {/* Header Space */}
      <div className="h-20 bg-gray-900 border-b border-white/5 relative overflow-hidden">
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 10% 50%, #e8511a 0%, transparent 50%)" }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
        
        {/* Profile Hero Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-4 sm:p-5 mb-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="w-16 h-16 bg-accent text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-2xl shadow-orange-500/30 shrink-0">
              {initials}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      className="text-2xl font-black text-gray-900 border-b-2 border-accent outline-none bg-transparent"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <button onClick={handleUpdateName} className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all"><Save size={16} /></button>
                    <button onClick={() => { setEditing(false); setNewName(user.name); }} className="p-2 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200 transition-all"><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
                    <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"><Edit3 size={16} /></button>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full">
                  <ShieldCheck size={12} /> {user.role.toUpperCase()}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-black px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full uppercase tracking-wider">
                  UID: PB-UID-{user.id}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar size={12} /> Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button 
              onClick={() => navigate("/")}
              className="text-xs font-bold text-gray-400 hover:text-gray-900 flex items-center gap-1 transition-all"
            >
              <ArrowLeft size={14} /> Back to Shopping
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Left / Navigation Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Account Settings</h3>
              <div className="space-y-1">
                {[
                  { id: "profile", icon: <User size={16} />, label: "Personal Info" },
                  { id: "requirements", icon: <ClipboardList size={16} />, label: "My Requirements" },
                  { id: "address", icon: <MapPin size={16} />, label: "Saved Addresses" },
                ].map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? "bg-accent text-white shadow-md shadow-orange-500/20" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right / Main Content Column */}
          <div className="md:col-span-2 space-y-6">
            
            {activeTab === "profile" && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn">
                 <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
                   <Mail size={16} className="text-accent" />
                   <h3 className="font-syne font-black text-gray-900">Contact Details</h3>
                 </div>
                 <div className="p-6 space-y-4">
                   <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Email Address</span>
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {user.email} 
                        {user.is_verified ? <ShieldCheck size={14} className="text-green-500" /> : null}
                      </p>
                   </div>
                   <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Mobile Number</span>
                      {editing ? (
                        <div className="flex items-center gap-2 border-b border-accent py-1">
                           <span className="text-sm font-bold text-gray-400">+91</span>
                           <input 
                             type="tel"
                             className="text-sm font-bold text-gray-900 outline-none w-full bg-transparent"
                             value={newMobile}
                             maxLength={10}
                             onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ""))}
                             placeholder="10-digit mobile"
                           />
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-gray-900">
                          {user.mobile ? `+91 ${user.mobile}` : "Not provided"}
                        </p>
                      )}
                   </div>
                   <p className="text-[11px] text-gray-400 bg-blue-50 border border-blue-100 p-3 rounded-xl leading-relaxed">
                     Your identity and contact info are used for order confirmation and dispatch.
                   </p>
                 </div>
              </div>
            )}

            {activeTab === "requirements" && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-fadeIn">
                 <InquiryHistory />
              </div>
            )}
            
            {activeTab === "address" && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-fadeIn">
                 <AddressManager />
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
