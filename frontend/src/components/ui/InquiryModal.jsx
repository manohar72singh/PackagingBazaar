import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Package, MessageSquare, ShieldCheck, Ruler, Phone, MapPin, User, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { submitInquiryAPI, fetchPincodeDetailsAPI } from "../../services/inquiryServices";
import { useNotification } from "../../context/NotificationContext";
import { fetchUserData } from "../../services/authServices";

export default function InquiryModal({ isOpen, onClose, product, customSubmit }) {
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState("");
  const [thickness, setThickness] = useState("");
  const [width, setWidth] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [message, setMessage] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState("idle");

  const [buyerName, setBuyerName] = useState("");

  const [loading, setLoading] = useState(false);
  const { notifySuccess, notifyError } = useNotification();
  const token = localStorage.getItem("token");

  // Dynamic initialization
  useEffect(() => {
    if (isOpen && product) {
      if (product.id !== "BULK") {
        setThickness(product.selected_thickness || product.thickness || "");
        setWidth(product.selected_width || product.width || "");
        setQuantity(product.selected_quantity || "");
      }
    }
  }, [isOpen, product]);

  // Fetch and auto-fill user details if logged in
  useEffect(() => {
    if (isOpen && token) {
      const getUserData = async () => {
        try {
          const res = await fetchUserData();
          if (res.success && res.user) {
            setBuyerName(res.user.name || "");
            if (res.user.mobile) {
              setPhone(res.user.mobile);
            }
          }
        } catch (err) {
          console.error("Error fetching user data in modal:", err);
        }
      };
      getUserData();
    }
  }, [isOpen, token]);

  if (!isOpen || !product) return null;

  const handleClose = () => {
    setQuantity("");
    setThickness("");
    setWidth("");
    setPhone("");
    setPincode("");
    setAddress("");
    setCity("");
    setState("");
    setPincodeStatus("idle");
    setMessage("");
    setBuyerName("");
    setStep(1);
    onClose();
  };

  const handlePincodeChange = async (val) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setPincode(cleaned);

    if (cleaned.length < 6) {
      setPincodeStatus("idle");
      setAddress("");
      return;
    }

    setPincodeStatus("loading");
    try {
      const data = await fetchPincodeDetailsAPI(cleaned);

      if (data.success) {
        setCity(data.city);
        setState(data.state);
        setAddress(data.address);
        setPincodeStatus("valid");
      } else {
        setAddress("");
        setCity("");
        setState("");
        setPincodeStatus("invalid");
      }
    } catch {
      setAddress("");
      setCity("");
      setState("");
      setPincodeStatus("invalid");
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (product.id !== "BULK" && !quantity) {
        notifyError("Please enter the quantity you need");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (phone.length !== 10) {
        notifyError("Please enter a valid 10-digit mobile number");
        return;
      }
      if (pincode.length !== 6 || pincodeStatus !== "valid") {
        notifyError("Please enter a valid 6-digit pincode");
        return;
      }
      setStep(3);
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (phone.length !== 10) {
      notifyError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (pincode.length !== 6 || pincodeStatus !== "valid") {
      notifyError("Please enter a valid 6-digit pincode");
      return;
    }
    if (!token && !buyerName) {
      notifyError("Please provide your name for the inquiry");
      return;
    }
    if (product.id !== "BULK" && !quantity) {
      notifyError("Please enter the quantity you need");
      return;
    }

    setLoading(true);
    try {
      const data = {
        quantity: product.id !== "BULK" ? (quantity || "Not specified") : undefined,
        thickness,
        width,
        phone,
        pincode,
        city,
        state,
        address,
        message,
        buyer_name: buyerName,
      };

      if (customSubmit) {
        await customSubmit(data);
        return;
      }

      const res = await submitInquiryAPI({ product_id: product.id, ...data });

      if (res.success) {
        notifySuccess("Request sent! Admin will contact you.");
        handleClose();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full sm:max-w-xl sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn relative flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-900 transition-all z-20"
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div className="bg-gray-900 px-6 py-5 text-white shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={13} className="text-accent" />
            <span className="text-[9px] font-black uppercase tracking-widest text-accent">Verified Quotation Wizard</span>
          </div>
          <h2 className="text-base sm:text-lg font-syne font-black uppercase tracking-tight">Requirement Details</h2>
        </div>

        {/* Step Indicator Header Progress Bar */}
        <div className="bg-gray-100 h-1.5 w-full shrink-0 relative">
          <div
            className="bg-accent h-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Scrollable form body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">

          {/* Step 1: Specs */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex gap-3 items-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-accent flex items-center justify-center shrink-0">
                  <Package size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-900 leading-tight">Step 1: Product Specifications</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Let's define the bulk dimensions and quantity needed.</p>
                </div>
              </div>

              {product.id !== "BULK" && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Quantity Needed *</label>
                  <div className="relative">
                    <Package size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. 500kg"
                      className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {product.id !== "BULK" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Thickness (Micron)</label>
                    <div className="relative">
                      <Ruler size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
                      <input
                        type="text"
                        placeholder="Micro/mm"
                        className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
                        value={thickness}
                        onChange={(e) => setThickness(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Width</label>
                    <div className="relative">
                      <Ruler size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g. 1000"
                        className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Contact & Location */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex gap-3 items-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-accent flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-900 leading-tight">Step 2: Contact & Location</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Where should we deliver the materials?</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Mobile No. *</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="10-digit number"
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Delivery Pincode *</label>
                <div className="relative">
                  <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Delivery Pin"
                    inputMode="numeric"
                    maxLength={6}
                    className={`w-full pl-9 pr-10 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-[12px] font-bold text-ink ${pincodeStatus === "valid" ? "border-green-400 focus:border-green-400" :
                        pincodeStatus === "invalid" ? "border-red-400 focus:border-red-400" : "border-gray-100 focus:border-accent"
                      }`}
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    required
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {pincodeStatus === "loading" && <Loader2 size={13} className="animate-spin text-accent" />}
                    {pincodeStatus === "valid" && <CheckCircle size={13} className="text-green-500" />}
                    {pincodeStatus === "invalid" && <AlertCircle size={13} className="text-red-500" />}
                  </div>
                </div>

                {pincodeStatus === "valid" && address && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-xl animate-fadeIn">
                    <p className="text-[10px] font-bold text-green-700 leading-tight">
                      <span className="uppercase text-[8px] font-black block mb-0.5 text-green-600/70">Verified Address</span>
                      {address}
                    </p>
                  </div>
                )}
                {pincodeStatus === "invalid" && (
                  <p className="mt-1 text-[10px] font-bold text-red-500 pl-1">Invalid pincode. Please check.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Verification & Notes */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex gap-3 items-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-accent flex items-center justify-center shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-900 leading-tight">Step 3: Personal & Notes</h4>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Provide details to identify and route your requirement.</p>
                </div>
              </div>

              {!token && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Full Name *</label>
                  <div className="relative">
                    <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter your name"
                      className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Message / Instructions (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Type any specific customizations, thickness requirements, printing specifications or delivery timeline details here..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink transition-all resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Wizard Action Buttons */}
          <div className="flex gap-3 pt-3 pb-2 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all animate-fadeIn"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-[2] bg-black text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || (pincode.length === 6 && pincodeStatus !== "valid")}
                className="flex-[2] bg-accent text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Sending..." : <><Send size={13} /> Send Requirement</>}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}