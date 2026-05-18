import { useState, useEffect } from "react";
import { Plus, Home, Briefcase, MapPin, Trash2, CheckCircle, MoreVertical, Edit3 } from "lucide-react";
import { fetchAddresses, addAddressAPI, updateAddressAPI, deleteAddressAPI, setDefaultAddressAPI } from "../../services/userServices";
import { useNotification } from "../../context/NotificationContext";

export default function AddressManager() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const { notifySuccess, notifyError } = useNotification();
  const [formData, setFormData] = useState({
    tag: "Home",
    address_line: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false,
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  // Lock scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [showModal]);

  const loadAddresses = async () => {
    try {
      const res = await fetchAddresses();
      if (res.success) setAddresses(res.data);
    } catch (err) {
      notifyError("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (addr = null) => {
    if (addr) {
      setEditingAddress(addr);
      setFormData({
        tag: addr.tag,
        address_line: addr.address_line,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        is_default: !!addr.is_default,
      });
    } else {
      setEditingAddress(null);
      setFormData({
        tag: "Home",
        address_line: "",
        city: "",
        state: "",
        pincode: "",
        is_default: addresses.length === 0, // First address is default
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await updateAddressAPI(editingAddress.id, formData);
        notifySuccess("Address updated");
      } else {
        await addAddressAPI(formData);
        notifySuccess("Address added");
      }
      setShowModal(false);
      loadAddresses();
    } catch (err) {
      notifyError("Process failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await deleteAddressAPI(id);
      notifySuccess("Address deleted");
      loadAddresses();
    } catch (err) {
      notifyError("Delete failed");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddressAPI(id);
      notifySuccess("Default address updated");
      loadAddresses();
    } catch (err) {
      notifyError("Failed to set default");
    }
  };

  if (loading) return <div className="animate-pulse text-gray-400 text-xs py-4 text-center">Loading addresses...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <MapPin size={16} className="text-accent" /> Saved Addresses
        </h3>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 text-xs font-bold text-accent bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors"
        >
          <Plus size={14} /> Add New
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {addresses.map((addr) => (
          <div key={addr.id} className={`p-5 rounded-2xl border transition-all relative group ${addr.is_default ? "border-accent bg-orange-50/20" : "border-gray-100 bg-white hover:border-gray-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${addr.is_default ? "bg-accent text-white" : "bg-gray-100 text-gray-500"}`}>
                  {addr.tag === "Home" ? <Home size={14} /> : addr.tag === "Office" ? <Briefcase size={14} /> : <MapPin size={14} />}
                </div>
                <span className="text-xs font-bold text-gray-900">{addr.tag}</span>
                {addr.is_default && <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-full font-black uppercase">Default</span>}
              </div>
              
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(addr)} className="p-2 bg-gray-50 text-gray-400 hover:text-accent rounded-xl transition-all"><Edit3 size={15} /></button>
                <button onClick={() => handleDelete(addr.id)} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={15} /></button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
              <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                {addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}
              </p>

              {!addr.is_default && (
                <button 
                  onClick={() => handleSetDefault(addr.id)}
                  className="text-[11px] font-black text-accent bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-accent hover:text-white transition-all whitespace-nowrap"
                >
                  SET AS DEFAULT
                </button>
              )}
            </div>
          </div>
        ))}
        
        {addresses.length === 0 && (
          <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
            <p className="text-xs text-gray-400">No addresses saved yet.</p>
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-fadeIn" 
            onClick={() => setShowModal(false)}
          />
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] relative z-10 animate-scaleIn border border-gray-100 mx-auto">
            <div className="px-7 py-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div>
                <h4 className="font-syne font-black text-lg text-gray-900 leading-tight">
                  {editingAddress ? "Update" : "New Address"}
                </h4>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-2xl bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-all duration-200"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Label</label>
                <div className="flex gap-1.5">
                  {[
                    { val: "Home", icon: <Home size={12} /> },
                    { val: "Office", icon: <Briefcase size={12} /> },
                    { val: "Other", icon: <MapPin size={12} /> }
                  ].map(t => (
                    <button 
                      key={t.val} type="button" 
                      onClick={() => setFormData({...formData, tag: t.val})}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black border flex items-center justify-center gap-1.5 transition-all duration-200 ${formData.tag === t.val ? "bg-accent text-white border-accent shadow-md shadow-orange-500/10" : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"}`}
                    >
                      {t.icon} {t.val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Address</label>
                <textarea 
                  required
                  rows={2}
                  className="w-full bg-gray-50/50 border border-black/[0.03] rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-accent ring-0 focus:ring-4 focus:ring-accent/5 outline-none transition-all resize-none font-medium text-gray-700"
                  placeholder="Street details..."
                  value={formData.address_line}
                  onChange={(e) => setFormData({...formData, address_line: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">City / State</label>
                  <div className="flex gap-2">
                    <input required type="text" className="w-1/2 bg-gray-50/50 border border-black/[0.03] rounded-lg px-3 py-2.5 text-xs focus:bg-white focus:border-accent outline-none font-medium text-gray-700" placeholder="City" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                    <input required type="text" className="w-1/2 bg-gray-50/50 border border-black/[0.03] rounded-lg px-3 py-2.5 text-xs focus:bg-white focus:border-accent outline-none font-medium text-gray-700" placeholder="State" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Pincode</label>
                  <input required type="text" className="w-full bg-gray-50/50 border border-black/[0.03] rounded-lg px-3 py-2.5 text-xs focus:bg-white focus:border-accent outline-none font-medium text-gray-700" placeholder="6 digits" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer group py-0.5">
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${formData.is_default ? "bg-accent border-accent" : "bg-white border-gray-200 group-hover:border-accent"}`}>
                  {formData.is_default && <CheckCircle size={10} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                />
                <span className={`text-[10px] font-bold transition-colors ${formData.is_default ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"}`}>Set as default shipping address</span>
              </label>

              <button 
                type="submit"
                className="w-full bg-accent text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 active:scale-[0.98] transition-all duration-200 mt-1 shadow-lg shadow-orange-500/10"
              >
                {editingAddress ? "Update" : "Save Address"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
