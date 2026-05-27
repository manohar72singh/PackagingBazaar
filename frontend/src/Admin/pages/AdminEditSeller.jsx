import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  RefreshCcw, 
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText
} from "lucide-react";
import { updateSellerAdmin } from "../../services/adminServices";
import { API_BASE_URL } from "../../services/api";
import { useNotification } from "../../context/NotificationContext";
import { fetchPincodeDetailsAPI } from "../../services/inquiryServices";

const inputCls = "w-full px-4 py-2.5 text-sm border border-black/[0.1] rounded-xl bg-slate-50 focus:outline-none focus:bg-white focus:border-accent transition-colors text-ink placeholder:text-slate-400 font-medium";

const Field = ({ label, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between">
      <label className="text-xs font-semibold text-ink uppercase tracking-wider">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
    </div>
    {children}
  </div>
);

export default function AdminEditSeller() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifySuccess, notifyError } = useNotification();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    mobile: "",
    businessType: "",
    gstNumber: "",
    yearEstablished: "",
    city: "",
    state: "",
    pincode: "",
    businessAddress: "",
    description: "",
    status: "",
    gstCertificate: null,
    existingGstCertificate: ""
  });
  const [pincodeStatus, setPincodeStatus] = useState("idle");

  useEffect(() => {
    if (location.state?.seller) {
      const s = location.state.seller;
      setForm({
        companyName: s.company_name || "",
        ownerName: s.owner_name || "",
        email: s.email || "",
        mobile: s.mobile || "",
        businessType: s.business_type || "",
        gstNumber: s.gst_number || "",
        yearEstablished: s.year_established || "",
        city: s.city || "",
        state: s.state || "",
        pincode: s.pincode || "",
        businessAddress: s.business_address || "",
        description: s.description || "",
        status: s.status || "",
        gstCertificate: null,
        existingGstCertificate: s.gst_certificate || ""
      });
    } else {
      notifyError("Seller data not found");
      navigate("/admin/sellers");
    }
  }, [id, location.state]);

  const setVal = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePincodeChange = async (val) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setVal("pincode", cleaned);
    if (cleaned.length < 6) {
      setPincodeStatus("idle");
      return;
    }
    setPincodeStatus("loading");
    try {
      const data = await fetchPincodeDetailsAPI(cleaned);
      if (data.success) {
        setVal("city", data.city);
        setVal("state", data.state);
        setVal("businessAddress", data.address);
        setPincodeStatus("valid");
      } else {
        setPincodeStatus("invalid");
      }
    } catch {
      setPincodeStatus("invalid");
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await updateSellerAdmin(id, form);
      if (res.success) {
        notifySuccess("Seller updated successfully");
        navigate("/admin/sellers");
      }
    } catch (err) {
      notifyError("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto">
      <button 
        onClick={() => navigate("/admin/sellers")}
        className="flex items-center gap-2 text-gray-500 hover:text-ink mb-6 font-bold text-sm"
      >
        <ChevronLeft size={18} /> Back to Sellers
      </button>

      <div className="bg-white border border-gray-100 rounded-[3rem] shadow-sm overflow-hidden p-8 sm:p-12">
        <h3 className="font-syne font-black text-2xl uppercase mb-8 flex items-center gap-3">
          <Building2 className="text-accent" /> Edit Business Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Field label="Company Name" required>
                <input className={inputCls} value={form.companyName} onChange={(e) => setVal("companyName", e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Owner Name" required>
                  <input className={inputCls} value={form.ownerName} onChange={(e) => setVal("ownerName", e.target.value)} />
                </Field>
                <Field label="Business Type">
                  <input className={inputCls} value={form.businessType} onChange={(e) => setVal("businessType", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Email Address" required>
                  <input className={inputCls} value={form.email} onChange={(e) => setVal("email", e.target.value)} />
                </Field>
                <Field label="Mobile Number" required>
                  <input className={inputCls} value={form.mobile} onChange={(e) => setVal("mobile", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="GST Number">
                  <input className={inputCls} value={form.gstNumber} onChange={(e) => setVal("gstNumber", e.target.value)} />
                </Field>
                <Field label="Status">
                  <select className={inputCls} value={form.status} onChange={(e) => setVal("status", e.target.value)}>
                    <option value="verified">Verified</option>
                    <option value="hold">Hold</option>
                  </select>
                </Field>
              </div>
              <Field label="Description">
                <textarea className={inputCls + " h-20"} value={form.description} onChange={(e) => setVal("description", e.target.value)} />
              </Field>

              <Field label="GST Certificate" hint="Max 5MB (PDF/JPG/PNG)">
                <div className="flex flex-col gap-3">
                  {form.existingGstCertificate && !form.gstCertificate && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <FileText className="text-blue-600" size={24} />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Existing Document</p>
                        <a 
                          href={form.existingGstCertificate.startsWith('http') ? form.existingGstCertificate : `${API_BASE_URL.replace('/api', '')}/${form.existingGstCertificate}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs font-bold text-blue-800 hover:underline truncate block"
                        >
                          View Current Certificate
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="relative group/file">
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      onChange={(e) => setVal("gstCertificate", e.target.files[0])} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${form.gstCertificate ? "border-green-300 bg-green-50" : "border-slate-100 bg-slate-50 group-hover/file:border-accent/30"}`}>
                      {form.gstCertificate ? (
                        <>
                          <CheckCircle2 className="text-green-500" size={24}/>
                          <p className="text-xs font-bold text-green-700">{form.gstCertificate.name}</p>
                          <p className="text-[8px] font-black text-green-500 uppercase tracking-tighter">(Will be updated)</p>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={24} className="text-slate-300 group-hover/file:text-accent"/>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload new file</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Field>
            </div>

           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <Field label="Pincode" required>
                    <div className="relative">
                      <input 
                        className={inputCls} 
                        maxLength={6} 
                        value={form.pincode} 
                        onChange={(e) => handlePincodeChange(e.target.value)} 
                      />
                      {pincodeStatus === 'loading' && <RefreshCcw size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-accent"/>}
                      {pincodeStatus === 'valid' && <CheckCircle2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"/>}
                      {pincodeStatus === 'invalid' && <AlertCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"/>}
                    </div>
                 </Field>
                 <Field label="City">
                    <input className={inputCls + " opacity-60 bg-gray-100 cursor-not-allowed"} value={form.city} readOnly />
                 </Field>
              </div>
              <Field label="State">
                <input className={inputCls + " opacity-60 bg-gray-100 cursor-not-allowed"} value={form.state} readOnly />
              </Field>
              <Field label="Address" required hint={pincodeStatus !== 'valid' ? "Enter valid pincode first" : "Edit details if needed"}>
                <textarea 
                  className={inputCls + " h-24 " + (pincodeStatus !== 'valid' ? "opacity-60 bg-gray-100 cursor-not-allowed" : "")} 
                  value={form.businessAddress} 
                  onChange={(e) => setVal("businessAddress", e.target.value)}
                  disabled={pincodeStatus !== 'valid'}
                  placeholder="Business address will auto-fill from pincode"
                />
              </Field>
           </div>
        </div>

        <div className="mt-12 pt-8 border-t flex justify-end">
           <button 
             onClick={handleUpdate}
             disabled={loading}
             className="px-10 py-4 bg-accent text-white rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
           >
             {loading ? <RefreshCcw size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
             Save Changes
           </button>
        </div>
      </div>
    </div>
  );
}
