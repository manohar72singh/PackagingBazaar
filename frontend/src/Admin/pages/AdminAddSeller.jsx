import React, { useState } from "react";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  ShieldCheck,
  Globe,
  MapPin as MapPinIcon,
  UploadCloud,
  Search,
  RefreshCcw,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { addSellerAdmin } from "../../services/adminServices";
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

export default function AdminAddSeller() {
  const [loading, setLoading] = useState(false);
  const [sellerPhase, setSellerPhase] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState("idle");
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();

  const BUSINESS_TYPES = ["Manufacturer", "Trader", "Stockist", "Distributor", "Converter"];

  const [sellerForm, setSellerForm] = useState({
    ownerName: "", email: "", password: "", confirmPassword: "", mobile: "",
    companyName: "", businessType: [], gstNumber: "", gstCertificate: null,
    city: "", state: "", pincode: "", businessAddress: "", yearEstablished: "", description: ""
  });

  const setSellerVal = (k, v) => setSellerForm(f => ({ ...f, [k]: v }));

  const toggleBusinessType = (type) => {
    setSellerVal("businessType", 
      sellerForm.businessType.includes(type)
        ? sellerForm.businessType.filter(t => t !== type)
        : [...sellerForm.businessType, type]
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return notifyError("File size exceeds 5MB limit.");
      setSellerVal("gstCertificate", file);
    }
  };

  const handlePincodeChange = async (val) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setSellerVal("pincode", cleaned);
    if (cleaned.length < 6) {
      setPincodeStatus("idle");
      setSellerVal("city", "");
      setSellerVal("state", "");
      return;
    }
    setPincodeStatus("loading");
    try {
      const data = await fetchPincodeDetailsAPI(cleaned);
      if (data.success) {
        setSellerVal("city", data.city);
        setSellerVal("state", data.state);
        setSellerVal("businessAddress", data.address);
        setPincodeStatus("valid");
      } else {
        setPincodeStatus("invalid");
      }
    } catch {
      setPincodeStatus("invalid");
    }
  };

  const handleCreateSeller = async () => {
    if (!sellerForm.companyName || pincodeStatus !== "valid") return notifyError("Company name and valid pincode required");
    if (sellerForm.businessType.length === 0) return notifyError("Please select at least one business type");
    if (!sellerForm.gstNumber || sellerForm.gstNumber.length !== 15) return notifyError("Valid 15-digit GST number required");
    if (!sellerForm.gstCertificate) return notifyError("GST Certificate is mandatory");
    
    setLoading(true);
    try {
      const res = await addSellerAdmin(sellerForm);
      if (res.success) {
        notifySuccess("Seller registered successfully!");
        navigate("/admin/sellers");
      }
    } catch (err) {
      notifyError(err?.response?.data?.message || "Failed to create seller");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      <div className="bg-white border border-gray-100 rounded-[3rem] shadow-sm overflow-hidden p-8 sm:p-12">
        {/* Progress */}
        <div className="flex justify-center gap-8 mb-12">
            {[1, 2].map(p => (
              <div key={p} className={`flex items-center gap-2 ${sellerPhase === p ? "text-accent" : "text-slate-300"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${sellerPhase === p ? "border-accent bg-accent text-white" : sellerPhase > p ? "bg-green-500 border-green-500 text-white" : "border-slate-200"}`}>
                  {sellerPhase > p ? <CheckCircle2 size={16}/> : p}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">{p === 1 ? "Personal" : "Business"}</span>
              </div>
            ))}
        </div>

        {sellerPhase === 1 ? (
          <div className="space-y-6">
            <h3 className="font-syne font-black text-2xl uppercase">Identity Details</h3>
            <Field label="Owner Name" required>
              <input className={inputCls} placeholder="Full Legal Name" value={sellerForm.ownerName} onChange={(e) => setSellerVal("ownerName", e.target.value)} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <Field label="Email Address" required>
                <input className={inputCls} placeholder="email@example.com" value={sellerForm.email} onChange={(e) => setSellerVal("email", e.target.value)} />
              </Field>
              <Field label="Mobile Number" required>
                <input className={inputCls} placeholder="10 Digit Mobile" maxLength={10} value={sellerForm.mobile} onChange={(e) => setSellerVal("mobile", e.target.value.replace(/\D/g, ""))} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <Field label="Password" required>
                 <div className="relative">
                  <input type={showPw ? "text" : "password"} className={inputCls} value={sellerForm.password} onChange={(e) => setSellerVal("password", e.target.value)} />
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                 </div>
              </Field>
              <Field label="Confirm Password" required>
                <input type="password" className={inputCls} value={sellerForm.confirmPassword} onChange={(e) => setSellerVal("confirmPassword", e.target.value)} />
              </Field>
            </div>
            <button
               onClick={() => {
                 if(!sellerForm.ownerName || !sellerForm.email || !sellerForm.password) return notifyError("Complete basic details");
                 if(sellerForm.password !== sellerForm.confirmPassword) return notifyError("Passwords mismatch");
                 setSellerPhase(2);
               }}
               className="w-full py-4 bg-accent text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2"
            >
              Next Step <ChevronRight size={16}/>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
             <h3 className="font-syne font-black text-2xl uppercase">Business Profile</h3>
             <Field label="Company Name" required>
                <input className={inputCls} placeholder="Official business name" value={sellerForm.companyName} onChange={(e) => setSellerVal("companyName", e.target.value)} />
             </Field>

             <Field label="Business Type" required hint="Select multiple if applicable">
                <div className="flex flex-wrap gap-2 mt-1">
                  {BUSINESS_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleBusinessType(t)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                        sellerForm.businessType.includes(t)
                          ? "bg-accent text-white border-accent shadow-md shadow-orange-100"
                          : "bg-slate-50 text-slate-400 border-black/[0.05] hover:border-accent"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
             </Field>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="GST Number" required>
                  <input 
                    className={inputCls} 
                    maxLength={15} 
                    placeholder="15-digit GSTIN" 
                    value={sellerForm.gstNumber} 
                    onChange={(e) => setSellerVal("gstNumber", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} 
                  />
                </Field>
                <Field label="Established Year">
                  <input className={inputCls} type="number" placeholder="e.g. 2015" value={sellerForm.yearEstablished} onChange={(e) => setSellerVal("yearEstablished", e.target.value)} />
                </Field>
             </div>

             <Field label="GST Certificate" required hint="Max 5MB (PDF/JPG/PNG)">
                <div className="relative group/file">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${sellerForm.gstCertificate ? "border-green-300 bg-green-50" : "border-slate-100 bg-slate-50 group-hover/file:border-accent/30"}`}>
                    {sellerForm.gstCertificate ? (
                      <>
                        <CheckCircle2 className="text-green-500" size={24}/>
                        <p className="text-xs font-bold text-green-700">{sellerForm.gstCertificate.name}</p>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={24} className="text-slate-300 group-hover/file:text-accent"/>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload document</p>
                      </>
                    )}
                  </div>
                </div>
             </Field>

             <Field label="Pincode" required>
                <div className="relative">
                  <input className={inputCls} maxLength={6} placeholder="6 Digit Pincode" value={sellerForm.pincode} onChange={(e) => handlePincodeChange(e.target.value)} />
                  {pincodeStatus === 'loading' && <RefreshCcw size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-accent"/>}
                  {pincodeStatus === 'valid' && <CheckCircle2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"/>}
                </div>
             </Field>

             <Field label="Business Address" required>
                <textarea className={inputCls + " h-24"} placeholder="Full office address" value={sellerForm.businessAddress} onChange={(e) => setSellerVal("businessAddress", e.target.value)} />
             </Field>

             <Field label="Business Description">
                <textarea className={inputCls + " h-24"} placeholder="Tell us about the company..." value={sellerForm.description} onChange={(e) => setSellerVal("description", e.target.value)} />
             </Field>

             <div className="flex gap-4">
                <button onClick={() => setSellerPhase(1)} className="px-8 py-4 border rounded-2xl text-xs font-black uppercase flex items-center gap-2">
                  <ChevronLeft size={16}/> Back
                </button>
                <button onClick={handleCreateSeller} disabled={loading} className="flex-1 py-4 bg-accent text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2">
                  {loading ? <RefreshCcw size={16} className="animate-spin"/> : <ShieldCheck size={16}/>} Complete Onboarding
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
