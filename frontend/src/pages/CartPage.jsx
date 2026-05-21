import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, Send, ShieldCheck, Package } from "lucide-react";
import { motion } from "framer-motion";
import InquiryModal from "../components/ui/InquiryModal";
import { submitInquiryAPI } from "../services/inquiryServices";
import { useNotification } from "../context/NotificationContext";
import { getImageUrl } from "../services/api";

export default function CartPage() {
  const { cart, removeFromCart, updateInquiryQty, updateItemMessage, total, clearCart, count } = useCart();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { notifySuccess, notifyError } = useNotification();

  // Multi-item Inquiry State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (cart.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 animate-fadeIn">
      <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 bg-surface rounded-2xl sm:rounded-[2rem] flex items-center justify-center mb-4 sm:mb-6 shadow-sm border border-gray-100">
        <ShoppingBag className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 text-gray-300"/>
      </div>
      <h2 className="font-syne font-black text-xl xs:text-2xl sm:text-3xl text-gray-900 mb-2 sm:mb-3 uppercase tracking-tighter">Basket is Empty</h2>
      <p className="text-gray-400 font-medium mb-6 sm:mb-8 max-w-[180px] xs:max-w-[200px] sm:max-w-xs uppercase text-[9px] sm:text-[10px] tracking-widest leading-relaxed">No products selected for quotation</p>
      <button 
        onClick={() => navigate("/products")} 
        className="bg-accent text-white px-6 xs:px-8 py-3 xs:py-4 rounded-xl xs:rounded-2xl font-black text-[10px] xs:text-xs uppercase tracking-widest hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1 transition-all"
      >
        BROWSE FILMS
      </button>
    </div>
  );

  const handleBulkInquirySubmit = async (formData) => {
    setLoading(true);
    try {
      const promises = cart.map(item => 
        submitInquiryAPI({
          product_id: item.id,
          message: item.specific_message ? `Product Requirement Note: ${item.specific_message}` : `Bulk Inquiry: ${formData.message}`,
          // Use the item's own inquiry_quantity (the B2B order size)
          quantity: item.inquiry_quantity || formData.quantity || "Not specified",
          thickness: item.selected_thickness || "Standard", 
          width: item.selected_width || "Standard",
          phone: formData.phone,
          pincode: formData.pincode,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          buyer_name: formData.buyer_name,
          buyer_email: formData.buyer_email
        })
      );

      await Promise.all(promises);
      notifySuccess("Bulk inquiry sent! Manufacturers will contact you with factory-best prices.");
      clearCart();
      setIsModalOpen(false);
      if (token) navigate("/profile"); 
    } catch (err) {
      notifyError("Failed to send some inquiries. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutClick = () => {
    const missingNotes = cart.some(item => !item.specific_message || !item.specific_message.trim());
    if (missingNotes) {
      const proceed = window.confirm("Warning: Aapne kuch products ke liye specific requirements/notes nahi likhe hain. Kya aap default message ke sath checkout proceed karna chahte hain?");
      if (!proceed) return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="bg-surface/50 min-h-screen pt-20 xs:pt-24 sm:pt-28 pb-12 sm:pb-16">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col xs:flex-row items-center xs:items-baseline gap-1 xs:gap-2 sm:gap-4 mb-6 xs:mb-8 sm:mb-10 lg:mb-12 text-center xs:text-left">
          <h1 className="font-syne font-black text-2xl xs:text-3xl sm:text-4xl text-gray-900 uppercase tracking-tighter">Inquiry Basket</h1>
          <span className="text-accent font-black text-sm xs:text-base sm:text-lg">({count} items)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {cart.map((item, idx) => (
              <motion.div
                key={`${item.id}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
              >
              <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-black/[0.03] p-3 xs:p-4 flex flex-row gap-3 xs:gap-4 sm:gap-6 items-center shadow-sm group hover:border-accent/10 transition-all">
                {/* Product Image */}
                <div 
                  className="w-16 h-16 xs:w-20 xs:h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center border border-gray-50 overflow-hidden bg-gray-50/50"
                >
                  <img src={getImageUrl(item.image || item.image_url)} alt={item.name} className="w-full h-full object-cover" />
                </div>

                  {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-gray-900 text-sm xs:text-[15px] sm:text-lg leading-tight line-clamp-2">{item.name}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {item.selected_thickness ? (
                          <span className="flex items-center gap-1 text-[9px] xs:text-[10px] font-black bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md shadow-sm">
                            <span className="text-gray-400">T:</span> {item.selected_thickness}
                          </span>
                        ) : (
                          <span className="text-[9px] xs:text-[10px] font-bold text-gray-300 px-1.5 py-0.5 border border-dashed border-gray-200 rounded-md">T: —</span>
                        )}
                        {item.selected_width ? (
                          <span className="flex items-center gap-1 text-[9px] xs:text-[10px] font-black bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md shadow-sm">
                            <span className="text-gray-400">W:</span> {item.selected_width}
                          </span>
                        ) : (
                          <span className="text-[9px] xs:text-[10px] font-bold text-gray-300 px-1.5 py-0.5 border border-dashed border-gray-200 rounded-md">W: —</span>
                        )}
                        {item.selected_brand && (
                          <span className="text-[9px] xs:text-[10px] text-gray-500 font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md border border-blue-100">{item.selected_brand}</span>
                        )}
                        {item.color && (
                          <span className="text-[9px] xs:text-[10px] text-gray-400 font-bold uppercase border border-gray-100 px-1.5 py-0.5 rounded-md">{item.color}</span>
                        )}
                      </div>
                      {item.seller_uid && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[9px] text-accent font-black uppercase tracking-widest">Seller:</span>
                          <span className="text-[10px] text-gray-600 font-bold">{item.seller_uid}</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => removeFromCart(item)} 
                      className="text-gray-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>

                  {/* Inquiry Quantity (editable) */}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="text-accent font-black text-base xs:text-lg sm:text-xl leading-none">
                      ₹{item.price}
                      <span className="text-[9px] xs:text-[10px] text-gray-400 font-bold ml-1">/{item.unit}</span>
                    </div>

                    {/* Inquiry Qty Badge + Edit */}
                    <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                      <span className="text-orange-300 text-[9px] font-black uppercase tracking-widest pl-1">Qty:</span>
                      <input
                        type="text"
                        value={item.inquiry_quantity || ""}
                        onChange={(e) => updateInquiryQty(item, e.target.value)}
                        placeholder={`Enter ${item.unit || 'kg'}`}
                        className="w-16 xs:w-20 text-[11px] xs:text-xs font-black text-accent bg-transparent border-none focus:outline-none placeholder:text-orange-300/50 placeholder:font-bold"
                        aria-label="Inquiry quantity"
                      />
                    </div>
                  </div>

                  {/* Specific Message / Notes Input field */}
                  <div className="mt-3 pt-2.5 border-t border-dashed border-gray-100 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Specific Requirements / Custom Instructions
                      </label>
                      {!item.specific_message?.trim() && (
                        <span className="text-[8px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 animate-pulse">
                          ⚠️ Empty note
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={item.specific_message || ""}
                      onChange={(e) => updateItemMessage(item, e.target.value)}
                      placeholder="e.g. Need glossy finish, special custom sizing, or fast delivery notes..."
                      className="w-full text-[11px] font-semibold text-gray-700 bg-gray-50 hover:bg-gray-50/80 focus:bg-white border border-gray-100 focus:border-accent/30 rounded-xl px-3 py-2 focus:outline-none transition-all placeholder:text-gray-300 shadow-inner"
                    />
                  </div>
                </div>
              </div>
              </motion.div>
            ))}

            {/* Clear Basket Button */}
            <button 
              onClick={clearCart}
              className="text-gray-400 hover:text-gray-600 text-[10px] xs:text-xs font-black uppercase tracking-widest flex items-center gap-2 mt-3 xs:mt-4 ml-1 xs:ml-2 transition-colors"
            >
              <Trash2 className="w-3 h-3 xs:w-4 xs:h-4" />
              Clear basket
            </button>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-black/[0.03] p-6 xs:p-8 lg:p-10 shadow-sm h-fit lg:sticky lg:top-24">
              <h3 className="font-syne font-black text-lg xs:text-xl sm:text-2xl text-gray-900 mb-4 xs:mb-6 uppercase tracking-tighter">Basket Summary</h3>
              
              {/* Summary Details */}
              <div className="space-y-4 mb-6 xs:mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[9px] xs:text-[10px]">Total Products</span>
                  <span className="text-gray-900 font-black text-sm xs:text-base">{count}</span>
                </div>

                {/* Per-item specs summary */}
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                      {/* Product Name */}
                      <p className="text-gray-700 font-black text-[10px] xs:text-[11px] truncate mb-2 leading-tight">{item.name}</p>
                      {/* Specs Row */}
                      <div className="flex flex-wrap gap-1.5">
                        {item.selected_thickness ? (
                          <span className="flex items-center gap-1 text-[8px] xs:text-[9px] font-black bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md">
                            <span className="text-gray-400">T:</span> {item.selected_thickness}
                          </span>
                        ) : (
                          <span className="text-[8px] xs:text-[9px] font-bold text-gray-300 px-1.5 py-0.5 border border-dashed border-gray-200 rounded-md">T: —</span>
                        )}
                        {item.selected_width ? (
                          <span className="flex items-center gap-1 text-[8px] xs:text-[9px] font-black bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md">
                            <span className="text-gray-400">W:</span> {item.selected_width}
                          </span>
                        ) : (
                          <span className="text-[8px] xs:text-[9px] font-bold text-gray-300 px-1.5 py-0.5 border border-dashed border-gray-200 rounded-md">W: —</span>
                        )}
                        {item.inquiry_quantity ? (
                          <span className="flex items-center gap-1 text-[8px] xs:text-[9px] font-black bg-orange-50 border border-orange-200 text-accent px-1.5 py-0.5 rounded-md">
                            <span className="text-orange-300">Qty:</span> {item.inquiry_quantity} {item.unit || 'kg'}
                          </span>
                        ) : (
                          <span className="text-[8px] xs:text-[9px] font-bold text-orange-300 px-1.5 py-0.5 border border-dashed border-orange-200 rounded-md bg-orange-50/50">Qty: not set ⚠</span>
                        )}
                      </div>
                      {item.specific_message ? (
                        <div className="mt-1.5 text-[8px] font-semibold text-gray-500 bg-white border border-gray-100 rounded px-1.5 py-0.5 line-clamp-1 italic">
                          ✍ "{item.specific_message}"
                        </div>
                      ) : (
                        <div className="mt-1.5 text-[8px] font-black text-amber-600 bg-amber-50 border border-dashed border-amber-200 rounded px-1.5 py-0.5 line-clamp-1 italic">
                          ⚠️ No specific notes (using general message)
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="h-px bg-gray-100" />
                <p className="text-[9px] xs:text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                   These specs will be shared with sellers in leads.
                </p>
              </div>

              {/* Request Quotation Button */}
              <button 
                onClick={handleCheckoutClick} 
                className="w-full bg-accent text-white py-4 xs:py-5 rounded-xl xs:rounded-[1.5rem] font-black text-[10px] xs:text-xs uppercase tracking-widest hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-orange-500/10"
              >
                <span className="hidden xs:inline">REQUEST QUOTATION FOR ALL</span>
                <span className="xs:hidden">REQUEST QUOTATION</span>
                <Send className="w-4 h-4 xs:w-5 xs:h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>

              {/* Security Badge */}
              <div className="mt-6 xs:mt-8 flex flex-wrap items-center justify-center gap-3 xs:gap-4 opacity-40 grayscale">
                <ShieldCheck className="w-5 h-5 xs:w-6 xs:h-6" />
                <span className="text-[9px] xs:text-[10px] font-black uppercase tracking-widest">Verified B2B Lead</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      <InquiryModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         product={{ 
           id: "BULK", 
           name: `${count} Items in Basket`, 
           image_url: cart[0]?.image || cart[0]?.image_url,
           category_name: "Multiple Categories",
           seller_name: "Various Manufacturers"
         }}
         customSubmit={handleBulkInquirySubmit}
      />
    </div>
  );
}