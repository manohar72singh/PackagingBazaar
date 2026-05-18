// import { useState } from "react";
// import { createPortal } from "react-dom";
// import { X, Send, Package, MessageSquare, ShieldCheck, Ruler, Phone, MapPin, User, Loader2, CheckCircle, AlertCircle } from "lucide-react";
// import { submitInquiryAPI } from "../../services/inquiryServices";
// import { useNotification } from "../../context/NotificationContext";

// export default function InquiryModal({ isOpen, onClose, product, customSubmit }) {
//   const [quantity, setQuantity] = useState("");
//   const [thickness, setThickness] = useState("");
//   const [width, setWidth] = useState("");
//   const [phone, setPhone] = useState("");
//   const [pincode, setPincode] = useState("");
//   const [message, setMessage] = useState("");
  
//   // New States for Pincode Auto-fill
//   const [address, setAddress] = useState("");
//   const [pincodeStatus, setPincodeStatus] = useState("idle"); // idle | loading | valid | invalid

//   // Guest Fields
//   const [buyerName, setBuyerName] = useState("");
  
//   const [loading, setLoading] = useState(false);
//   const { notifySuccess, notifyError } = useNotification();
//   const token = localStorage.getItem("token");

//   if (!isOpen || !product) return null;

//   const handleClose = () => {
//     setQuantity("");
//     setThickness("");
//     setWidth("");
//     setPhone("");
//     setPincode("");
//     setAddress("");
//     setPincodeStatus("idle");
//     setMessage("");
//     setBuyerName("");
//     onClose();
//   };

//   const handlePincodeChange = async (val) => {
//     const cleaned = val.replace(/\D/g, "").slice(0, 6);
//     setPincode(cleaned);

//     if (cleaned.length < 6) {
//       setPincodeStatus("idle");
//       setAddress("");
//       return;
//     }

//     setPincodeStatus("loading");
//     try {
//       const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
//       const data = await res.json();

//       if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
//         const po = data[0].PostOffice[0];
//         const autoAddress = `${po.Name}, ${po.District}, ${po.State} - ${cleaned}`;
//         setAddress(autoAddress);
//         setPincodeStatus("valid");
//       } else {
//         setAddress("");
//         setPincodeStatus("invalid");
//       }
//     } catch {
//       setPincodeStatus("invalid");
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Basic Validation
//     if (phone.length !== 10) {
//       notifyError("Please enter a valid 10-digit mobile number");
//       return;
//     }
//     if (pincode.length !== 6 || pincodeStatus !== "valid") {
//       notifyError("Please enter a valid 6-digit pincode");
//       return;
//     }
    
//     // Guest Validation
//     if (!token && !buyerName) {
//       notifyError("Please provide your name for the inquiry");
//       return;
//     }

//     setLoading(true);
//     try {
//       const data = {
//         quantity: quantity || "Not specified",
//         thickness,
//         width,
//         phone,
//         pincode,
//         address,
//         message: message ,
//         buyer_name: buyerName,
//       };

//       if (customSubmit) {
//         await customSubmit(data);
//         return;
//       }

//       const res = await submitInquiryAPI({
//         product_id: product.id,
//         ...data
//       });

//       if (res.success) {
//         notifySuccess("Request sent! Admin will contact you.");
//         handleClose();
//       }
//     } catch (err) {
//       notifyError(err.response?.data?.message || "Failed to send request");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return createPortal(
//     <div 
//       className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
//       onClick={handleClose}
//     >
//       <div 
//         className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-slideUp relative"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Cancel Icon (X) */}
//         <button 
//           onClick={handleClose}
//           className="absolute top-5 right-5 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-900 transition-all z-20"
//         >
//           <X size={18} />
//         </button>

//         {/* Header - Compact */}
//         <div className="bg-gray-900 px-6 py-5 text-white">
//           <div className="flex items-center gap-2 mb-1">
//              <ShieldCheck size={14} className="text-accent" />
//              <span className="text-[9px] font-black uppercase tracking-widest text-accent">Verified Quotation</span>
//           </div>
//           <h2 className="text-lg font-syne font-black uppercase tracking-tight">Requirement Details</h2>
//         </div>

//         {/* Form Body - Compact */}
//         <form onSubmit={handleSubmit} className="p-6 space-y-3">
          
//           <div className="grid grid-cols-2 gap-3">
//             {/* Guest Identifier */}
//             {!token && (
//               <div className="col-span-2">
//                 <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Full Name</label>
//                 <div className="relative">
//                   <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                   <input 
//                     type="text" placeholder="Enter your name"
//                     className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
//                     value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Quantity */}
//             <div className="col-span-2 sm:col-span-1">
//               <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Qty Needed</label>
//               <div className="relative">
//                 <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input 
//                   type="text" placeholder="e.g. 500kg"
//                   className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
//                   value={quantity} onChange={(e) => setQuantity(e.target.value)} required
//                 />
//               </div>
//             </div>

//             {/* Phone */}
//             <div className="col-span-2 sm:col-span-1">
//               <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Mobile No.</label>
//               <div className="relative">
//                 <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input 
//                   type="text" placeholder="10-digit number"
//                   inputMode="numeric" maxLength={10}
//                   className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
//                   value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required
//                 />
//               </div>
//             </div>

//             {/* Thickness */}
//             <div className="col-span-1">
//               <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Thickness</label>
//               <div className="relative">
//                 <Ruler size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
//                 <input 
//                   type="text" placeholder="Micro/mm"
//                   className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
//                   value={thickness} onChange={(e) => setThickness(e.target.value)} required
//                 />
//               </div>
//             </div>

//             {/* Width */}
//             <div className="col-span-1">
//               <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Width</label>
//               <div className="relative">
//                 <Ruler size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input 
//                   type="text" placeholder="e.g. 1000"
//                   className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
//                   value={width} onChange={(e) => setWidth(e.target.value)} required
//                 />
//               </div>
//             </div>

//             {/* Pincode */}
//             <div className="col-span-2">
//               <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Pincode</label>
//               <div className="relative">
//                 <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input 
//                   type="text" placeholder="Delivery Pin"
//                   inputMode="numeric" maxLength={6}
//                   className={`w-full pl-9 pr-12 py-2.5 bg-gray-50 border rounded-xl outline-none transition-all text-[12px] font-bold text-ink ${
//                     pincodeStatus === "valid" ? "border-green-400 focus:border-green-400" : 
//                     pincodeStatus === "invalid" ? "border-red-400 focus:border-red-400" : "border-gray-100 focus:border-accent"
//                   }`}
//                   value={pincode} onChange={(e) => handlePincodeChange(e.target.value)} required
//                 />
//                 <div className="absolute right-3 top-1/2 -translate-y-1/2">
//                    {pincodeStatus === "loading" && <Loader2 size={14} className="animate-spin text-accent" />}
//                    {pincodeStatus === "valid" && <CheckCircle size={14} className="text-green-500" />}
//                    {pincodeStatus === "invalid" && <AlertCircle size={14} className="text-red-500" />}
//                 </div>
//               </div>
              
//               {/* Auto-filled Address Paragraph */}
//               {pincodeStatus === "valid" && address && (
//                 <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-xl animate-fadeIn">
//                    <p className="text-[10px] font-bold text-green-700 leading-tight">
//                      <span className="uppercase text-[8px] font-black block mb-0.5 text-green-600/70">Verified Address</span>
//                      {address}
//                    </p>
//                 </div>
//               )}
//               {pincodeStatus === "invalid" && (
//                 <p className="mt-1 text-[10px] font-bold text-red-500 pl-1">Invalid pincode. Please check.</p>
//               )}
//             </div>
//           </div>

//           <div className="relative pt-1">
//             <textarea 
//               rows={2} placeholder="Any other requirements..."
//               className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink transition-all resize-none"
//               value={message} onChange={(e) => setMessage(e.target.value)}
//             />
//           </div>

//           <div className="pt-2 flex gap-3">
//             <button 
//               type="button" onClick={handleClose}
//               className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit" disabled={loading || (pincode.length === 6 && pincodeStatus !== "valid")}
//               className="flex-[2] bg-accent text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
//             >
//               {loading ? "Sending..." : <><Send size={14} /> Send Requirement</>}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>,
//     document.body
//   );
// }
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Package, MessageSquare, ShieldCheck, Ruler, Phone, MapPin, User, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { submitInquiryAPI } from "../../services/inquiryServices";
import { useNotification } from "../../context/NotificationContext";
import { fetchUserData } from "../../services/authServices";

export default function InquiryModal({ isOpen, onClose, product, customSubmit }) {
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
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
      const data = await res.json();

      if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setCity(po.District);
        setState(po.State);
        setAddress(`${po.Name}, ${po.District}, ${po.State} - ${cleaned}`);
        setPincodeStatus("valid");
      } else {
        setAddress("");
        setCity("");
        setState("");
        setPincodeStatus("invalid");
      }
    } catch {
      setPincodeStatus("invalid");
    }
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
    // For single product, quantity is required
    if (product.id !== "BULK" && !quantity) {
      notifyError("Please enter the quantity you need");
      return;
    }

    setLoading(true);
    try {
      const data = {
        // For BULK: quantity is not needed here (each item has its own inquiry_quantity)
        // For single product: send what user typed
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
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full sm:max-w-xl sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl border border-gray-100 overflow-hidden animate-slideUp relative flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-900 transition-all z-20"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="bg-gray-900 px-5 py-4 text-white shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <ShieldCheck size={12} className="text-accent" />
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-accent">Verified Quotation</span>
          </div>
          <h2 className="text-sm sm:text-base font-syne font-black uppercase tracking-tight">Requirement Details</h2>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 overflow-y-auto flex-1">

          <div className="grid grid-cols-2 gap-3">

            {/* Guest Name */}
            {!token && (
              <div className="col-span-2 sm:flex sm:items-center sm:gap-4">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest sm:w-28 sm:text-right mb-1 sm:mb-0 block shrink-0">Full Name</label>
                <div className="relative flex-1">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" placeholder="Enter your name"
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
                    value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required
                  />
                </div>
              </div>
            )}

            {/* Quantity — Only show for single product inquiries.
                  For BULK cart, each item already has its own inquiry_quantity set in the cart. */}
            {product.id !== "BULK" && (
              <div className="col-span-2 sm:flex sm:items-center sm:gap-4">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest sm:w-28 sm:text-right mb-1 sm:mb-0 block shrink-0">Qty Needed</label>
                <div className="relative flex-1">
                  <Package size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" placeholder="e.g. 500kg"
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
                    value={quantity} onChange={(e) => setQuantity(e.target.value)} required
                  />
                </div>
              </div>
            )}

            {/* Phone */}
            <div className="col-span-2 sm:flex sm:items-center sm:gap-4">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest sm:w-28 sm:text-right mb-1 sm:mb-0 block shrink-0">Mobile No.</label>
              <div className="relative flex-1">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="10-digit number"
                  inputMode="numeric" maxLength={10}
                  className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required
                />
              </div>
            </div>

            {/* Thickness (Only for Single Product) */}
            {product.id !== "BULK" && (
                <div className="col-span-2 sm:flex sm:items-center sm:gap-4">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest sm:w-28 sm:text-right mb-1 sm:mb-0 block shrink-0">Thickness</label>
                <div className="relative flex-1">
                    <Ruler size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
                    <input
                    type="text" placeholder="Micro/mm"
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
                    value={thickness} onChange={(e) => setThickness(e.target.value)} required
                    />
                </div>
                </div>
            )}

            {/* Width (Only for Single Product) */}
            {product.id !== "BULK" && (
                <div className="col-span-2 sm:flex sm:items-center sm:gap-4">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest sm:w-28 sm:text-right mb-1 sm:mb-0 block shrink-0">Width</label>
                <div className="relative flex-1">
                    <Ruler size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                    type="text" placeholder="e.g. 1000"
                    className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink"
                    value={width} onChange={(e) => setWidth(e.target.value)} required
                    />
                </div>
                </div>
            )}

            {/* Pincode */}
            <div className="col-span-2 sm:flex sm:items-center sm:gap-4">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest sm:w-28 sm:text-right mb-1 sm:mb-0 block shrink-0">Pincode</label>
              <div className="relative flex-1">
                <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Delivery Pin"
                  inputMode="numeric" maxLength={6}
                  className={`w-full pl-8 pr-10 py-2.5 bg-gray-50 border rounded-xl outline-none transition-all text-[12px] font-bold text-ink ${
                    pincodeStatus === "valid" ? "border-green-400 focus:border-green-400" :
                    pincodeStatus === "invalid" ? "border-red-400 focus:border-red-400" : "border-gray-100 focus:border-accent"
                  }`}
                  value={pincode} onChange={(e) => handlePincodeChange(e.target.value)} required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {pincodeStatus === "loading" && <Loader2 size={13} className="animate-spin text-accent" />}
                  {pincodeStatus === "valid" && <CheckCircle size={13} className="text-green-500" />}
                  {pincodeStatus === "invalid" && <AlertCircle size={13} className="text-red-500" />}
                </div>
              </div>

              {pincodeStatus === "valid" && address && (
                <div className="mt-2 p-2.5 bg-green-50 border border-green-100 rounded-xl animate-fadeIn">
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

          <div className="sm:flex sm:items-start sm:gap-4">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest sm:w-28 sm:text-right mb-1 sm:mb-0 block shrink-0 pt-3">Message</label>
            <textarea
              rows={2} placeholder="Any other requirements..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent text-[12px] font-bold text-ink transition-all resize-none flex-1"
              value={message} onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-4 sm:pb-2">
            <button
              type="button" onClick={handleClose}
              className="flex-1 px-4 py-3.5 sm:py-3 bg-gray-50 sm:bg-gray-100 text-gray-500 sm:text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all border border-black/[0.03] sm:border-none order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={loading || (pincode.length === 6 && pincodeStatus !== "valid")}
              className="flex-[2] bg-accent text-white py-3.5 sm:py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
            >
              {loading ? "Sending..." : <><Send size={13} /> Send Requirement</>}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}