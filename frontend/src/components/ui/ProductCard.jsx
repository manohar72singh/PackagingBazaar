import { useState, useCallback, useEffect, useRef } from "react";
import { ShoppingCart, Eye, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import Badge from "./Badge";
import StarRating from "./StarRating";
import { getImageUrl } from "../../services/api";

const categoryColors = {
  BOPP: "from-green-50 to-emerald-100",
  PET: "from-blue-50 to-sky-100",
  CPP: "from-orange-50 to-amber-100",
  LAMINATED: "from-purple-50 to-pink-100",
};

export default function ProductCard({ product, onInquiry }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [showOptions, setShowOptions] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);
  const [specs, setSpecs] = useState({
    thickness: product.thickness || "",
    width: product.width || "",
    quantity: ""
  });

  const categoryName = product.category_name || "BOPP";
  const grad = categoryColors[categoryName] || "from-gray-50 to-gray-100";

  // Build images list: main image + additional_images
  const getAdditionalImages = () => {
    if (!product.additional_images) return [];
    if (Array.isArray(product.additional_images)) return product.additional_images;
    try { return JSON.parse(product.additional_images); } catch { return []; }
  };
  const images = [product.image_url, ...getAdditionalImages()].filter(Boolean);
  const hasMultiple = images.length > 1;

  // Auto-play carousel every 3 seconds, pause on hover
  useEffect(() => {
    if (!hasMultiple || isHovered) return;
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [hasMultiple, isHovered, images.length]);

  const goNext = useCallback((e) => {
    e.stopPropagation();
    clearInterval(intervalRef.current);
    setCurrentSlide(prev => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback((e) => {
    e.stopPropagation();
    clearInterval(intervalRef.current);
    setCurrentSlide(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleImageClick = () => {
    const sellerParam = product.seller_id ? `?sellerId=${product.seller_id}` : "";
    navigate(`/products/${product.id}${sellerParam}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!showOptions) { setShowOptions(true); return; }
    addToCart({
      ...product,
      selected_thickness: specs.thickness,
      selected_width: specs.width,
      selected_brand: product.brand || "",
      selected_quantity: specs.quantity
    });
    setShowOptions(false);
  };

  return (
    <div className={`bg-white rounded-2xl border border-black/[0.07] overflow-hidden transition-all duration-200 group flex flex-col h-full relative ${!showOptions ? "hover:-translate-y-1 hover:shadow-xl" : "shadow-2xl"}`}>
      {/* Image / Carousel area */}
      <div
        className={`bg-gradient-to-br ${grad} h-36 sm:h-48 md:h-52 flex items-center justify-center relative cursor-pointer overflow-hidden shrink-0 border-b border-black/[0.1]`}
        onClick={handleImageClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Badge */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20">
          <Badge tag={product.tag_name} />
        </div>

        {/* Eye button */}
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const sellerParam = product.seller_id ? `?sellerId=${product.seller_id}` : "";
              navigate(`/products/${product.id}${sellerParam}`);
            }}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow text-ink2 hover:text-accent border border-black/[0.05]"
            title="View Details"
          >
            <Eye size={14} />
          </button>
        </div>

        {/* Carousel images */}
        <div className="relative w-full h-full z-10">
          <img
            key={currentSlide}
            src={getImageUrl(images[currentSlide] || product.image_url)}
            alt={`${product.name} ${currentSlide + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        </div>

        {/* Carousel indicators — only if multiple images */}
        {hasMultiple && (
          <>
            {/* Dot indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
                  className={`rounded-full transition-all duration-200 ${
                    i === currentSlide
                      ? "w-4 h-1.5 bg-white"
                      : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Category chip */}
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20">
          <span className="text-[8px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-ink2 border border-black/[0.07]">
            {categoryName} · {product.subcategory_name}
          </span>
        </div>
      </div>


      {/* Info */}
      <div className="p-3 sm:p-4 lg:p-5 flex flex-col flex-1">
        <h3
          className="font-syne font-black text-xs sm:text-sm md:text-base text-ink mb-1.5 line-clamp-1 cursor-pointer hover:text-accent transition-colors uppercase tracking-tight"
          onClick={handleImageClick}
        >
          {product.name}
        </h3>
        <p className="text-[10px] sm:text-[11px] md:text-[12px] text-slate-500 mb-1.5 line-clamp-2 leading-relaxed overflow-hidden h-[2.5rem] sm:h-[2.8rem]">
          {product.description}
        </p>
        <div className="flex items-center gap-3 mt-2.5 mb-1.5 animate-fadeIn">
          <StarRating 
            rating={Number(product.avg_rating) || 0} 
            reviews={Number(product.review_count) || 0} 
          />
          
          {product.color && product.color !== 'N/A' && (
             <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 border border-black/[0.05] text-[9px] font-black text-slate-900 uppercase tracking-tight">
               <div className={`w-1.5 h-1.5 rounded-full shadow-inner ${
                 product.color.toLowerCase().includes('silver') ? 'bg-slate-300' :
                 product.color.toLowerCase().includes('gold') ? 'bg-amber-400' :
                 product.color.toLowerCase().includes('white') ? 'bg-white border border-gray-200' :
                 product.color.toLowerCase().includes('black') ? 'bg-black' :
                 product.color.toLowerCase().includes('transparent') ? 'bg-blue-50 border border-blue-100' :
                 'bg-accent'
               }`} />
               {product.color}
             </span>
           )}
        </div>
        
        {product.seller_count > 1 && (
          <div className="mt-2 mb-1">
            <span className="w-full text-[11px] text-center font-black text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-200 shadow-sm animate-fadeIn block">
             + {product.seller_count} Sellers Available
            </span>
          </div>
        )}
        {/* Quick Add Specs Popup Overlay (Bottom) */}
        {showOptions && (
          <div 
            className="absolute inset-0 bg-black/40 z-30 flex items-end animate-fadeIn"
            onClick={() => setShowOptions(false)}
          >
            <div 
              className="w-full bg-white rounded-t-3xl p-5 pb-6 animate-slideInUp shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
              onClick={(e) => e.stopPropagation()}
            >
          <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-3" />
              <h4 className="text-xs font-black uppercase tracking-widest text-ink mb-0.5 text-center">Select Specifications</h4>
              <p className="text-[9px] text-gray-400 font-bold text-center mb-4 uppercase tracking-widest">Tell us what you need — we'll get you the best price</p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">MIC</span>
                    <input
                      type="text"
                      placeholder="Thickness"
                      value={specs.thickness}
                      onChange={(e) => setSpecs({...specs, thickness: e.target.value})}
                      className="w-full bg-slate-50 border border-black/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-accent font-bold"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400">MM</span>
                    <input
                      type="text"
                      placeholder="Width"
                      value={specs.width}
                      onChange={(e) => setSpecs({...specs, width: e.target.value})}
                      className="w-full bg-slate-50 border border-black/5 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-accent font-bold"
                    />
                  </div>
                </div>

                {/* Inquiry Quantity — clearly labeled */}
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block"></span>
                    How much do you need?
                  </label>
                  <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-accent uppercase tracking-widest">{product.unit || 'kg'}</span>
                    <input
                      type="text"
                      placeholder={`e.g. 500, 1000, 5000`}
                      value={specs.quantity}
                      onChange={(e) => setSpecs({...specs, quantity: e.target.value})}
                      className="w-full bg-orange-50/60 border border-orange-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-accent font-black text-ink placeholder:text-gray-300"
                    />
                  </div>
                  <p className="text-[8px] text-gray-400 font-bold mt-1 pl-1">This quantity will be shown to sellers in the lead</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => setShowOptions(false)}
                    className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddToCart}
                    className="flex-[2] py-3.5 rounded-xl text-[10px] font-black uppercase bg-accent text-white hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all active:scale-95"
                  >
                    Add to Basket
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-auto pt-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-1.5">
              <div className="flex items-baseline gap-1">
                <span className="font-syne font-black text-sm lg:text-base text-ink">
                  ₹{product.min_price}
                </span>
                <span className="text-[10px] text-gray-400 font-bold">-</span>
                <span className="font-syne font-black text-sm lg:text-base text-ink">
                  ₹{product.max_price}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase shrink-0">
                /{product.unit}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold whitespace-nowrap bg-surface px-1.5 py-0.5 rounded">Min. {product.min_order}kg</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile: icon only | Desktop: icon + text */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onInquiry) onInquiry(product);
              }}
              className="flex-1 bg-accent text-white rounded-xl flex items-center justify-center gap-1.5 hover:bg-orange-600 active:scale-[0.98] transition-all font-black uppercase shadow-lg shadow-orange-100 py-3 md:py-4"
            >
              <Send size={14} className="shrink-0" />
              <span className="hidden sm:inline text-[10px] md:text-[11px] tracking-widest">Get Best Price</span>
              <span className="sm:hidden text-[9px] tracking-wider">Quote</span>
            </button>

            <button
              onClick={handleAddToCart}
              className="p-3 md:p-4 bg-gray-900 text-white rounded-xl hover:bg-black active:scale-[0.95] transition-all shadow-lg shadow-gray-200 shrink-0"
              title="Add to Basket"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}