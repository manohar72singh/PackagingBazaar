import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
// FIX: Changed import path to productServices
import {
  fetchProductById,
  fetchProducts,
  fetchProductVariants,
  fetchSellersByGroupKey,
} from "../services/productServices";
import { getImageUrl } from "../services/api";
import { useCart } from "../context/CartContext";
import Badge from "../components/ui/Badge";
import StarRating from "../components/ui/StarRating";
import ProductCard from "../components/ui/ProductCard";
import WhyChooseUs from "../components/sections/WhyChooseUs";
import InquiryModal from "../components/ui/InquiryModal";
import ReviewSection from "../components/sections/ReviewSection";
import {
  ShoppingCart,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Send,
  Activity,
  MessageCircle,
  MapPin,
  Clock,
  Zap,
  Truck,
  Ruler,
  Maximize,
  Palette,
  Layers,
  Check,
  Info,
  ShieldCheck,
  Star,
  ChevronRight,
} from "lucide-react";

const gradColors = {
  BOPP: "from-green-50 to-emerald-100",
  PET: "from-blue-50 to-sky-100",
  CPP: "from-orange-50 to-amber-100",
  LAMINATED: "from-purple-50 to-pink-100",
};

const formatDeliveryTime = (hours) => {
  if (!hours) return null;
  const h = parseInt(hours);
  if (isNaN(h)) return hours;
  if (h <= 48) return `${h} Hours`;
  const days = Math.floor(h / 24);
  return `${days} Days`;
};

const DeliveryBadge = ({ hours, timeStr, className = "" }) => {
  const formatted = formatDeliveryTime(hours) || timeStr;
  if (!formatted) return <span className="text-gray-400 font-bold">N/A</span>;
  
  const h = parseInt(hours);
  const isExpress = !isNaN(h) && h <= 24;
  const isStandard = !isNaN(h) && h <= 72;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black uppercase tracking-widest text-[9px] shadow-sm transition-all hover:scale-105 ${
      isExpress 
        ? "bg-orange-50 border-orange-100 text-accent shadow-orange-100/50" 
        : isStandard
          ? "bg-blue-50 border-blue-100 text-blue-600 shadow-blue-100/50"
          : "bg-slate-50 border-slate-100 text-slate-600 shadow-slate-100/50"
    } ${className}`}>
      {isExpress ? (
        <Zap size={12} className="fill-current animate-pulse" />
      ) : (
        <Truck size={12} className="fill-current/10" />
      )}
      {formatted}
      {isExpress && <span className="ml-1 text-[7px] bg-accent text-white px-1.5 py-0.5 rounded-full animate-bounce">Fast</span>}
    </div>
  );
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sellerId = searchParams.get("sellerId");
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inquiryProduct, setInquiryProduct] = useState(null);
  const [otherSellers, setOtherSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [quantity, setQuantity] = useState("");

  // Specifications Selection State
  const [selectedThickness, setSelectedThickness] = useState([]);
  const [selectedWidth, setSelectedWidth] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const toggleThickness = (micron) => {
    setSelectedThickness(prev =>
      prev.includes(micron)
        ? prev.filter(t => t !== micron)  // remove if already selected
        : [...prev, micron]               // add if not selected
    );
  };

  useEffect(() => {
    const getDetails = async () => {
      setLoading(true);
      try {
        // 1. Fetch main product details
        const res = await fetchProductById(id, sellerId);
        // Safe data handling
        const productData = res.data || res;
        setProduct(productData);

        // 2. Fetch related products (Same category, limit 4)
        if (productData && productData.category_name) {
          const relatedRes = await fetchProducts({
            category: productData.category_name,
            limit: 5, // Requesting 5 to leave 4 after filtering current product
          });

          const relatedData = relatedRes.data || relatedRes;

          if (Array.isArray(relatedData)) {
            // Remove current product from the list
            setRelated(
              relatedData.filter((p) => p.id !== Number(id)).slice(0, 4),
            );
          }
        }
        // 3. Fetch sibling variants
        const variantsRes = await fetchProductVariants(id);
        if (variantsRes.success) {
          setVariants(variantsRes.variants || []);
        }

        // 4. Fetch Other Sellers for comparison
        if (productData && productData.group_key) {
          setSellersLoading(true);
          const sellersRes = await fetchSellersByGroupKey(productData.group_key);
          if (sellersRes.success) {
            // Filter out current seller if needed, or show all
            setOtherSellers(sellersRes.data || []);
          }
          setSellersLoading(false);
        }
      } catch (err) {
        console.error("Error loading product details:", err);
      } finally {
        setLoading(false);
      }
    };

    getDetails();
    window.scrollTo(0, 0);
  }, [id, sellerId]);

  const handleAdd = () => {
    if (product) {
      const productWithSpecs = {
        ...product,
        selected_thickness: selectedThickness.join(", "),  // array to string
        selected_width: selectedWidth,
        selected_brand: selectedBrand,
        selected_quantity: quantity, // Use the state value directly
      };
      addToCart(productWithSpecs);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleOpenInquiry = (p) => {
    const base = p || product;
    // Merge selected specs so InquiryModal can pre-fill them
    setInquiryProduct({
      ...base,
      selected_thickness: selectedThickness.length > 0
        ? selectedThickness.join(", ")
        : base.thickness || "",
      selected_width: selectedWidth || base.width || "",
      selected_quantity: quantity || "", // Pass the typed quantity
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-accent" size={40} />
        <p className="text-ink3 animate-pulse font-medium">
          Fetching details...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-syne font-black text-2xl text-ink mb-3">
            Product Not Found
          </h2>
          <button
            onClick={() => navigate("/products")}
            className="text-accent underline font-medium"
          >
            ← Back to Products
          </button>
        </div>
      </div>
    );
  }
  const grad = gradColors[product.category_name] || "from-gray-50 to-gray-100";

  return (
    <div key={`${id}-${sellerId}`} className="animate-fadeIn bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[11px] font-semibold text-gray-400 mb-4">
          <button onClick={() => navigate("/products")} className="hover:text-accent transition-colors">Products</button>
          <ChevronRight size={12} />
          <span className="text-gray-500">{product.category_name}</span>
          <ChevronRight size={12} />
          <span className="text-gray-800 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-6 items-start">
          
          {/* LEFT: Image */}
          <div className="lg:sticky lg:top-4">
            <div className={`bg-gradient-to-br ${grad} rounded-2xl h-[300px] sm:h-[420px] flex items-center justify-center relative overflow-hidden border border-black/[0.06]`}>
              <img src={getImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 left-3"><Badge tag={product.tag_name} /></div>
              {product.is_verified && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-green-600 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-green-100 shadow-sm">
                  <ShieldCheck size={10} /> Verified Seller
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Info Panel */}
          <div className="flex flex-col gap-4">
            
            {/* Product Title Block */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <span className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/5 px-2.5 py-1 rounded-full border border-accent/10 inline-block mb-3">
                {product.category_name}{product.subcategory_name && ` · ${product.subcategory_name}`}
              </span>
              <h1 className="font-syne font-black text-xl sm:text-2xl text-gray-900 leading-snug uppercase tracking-tight mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-3">
                <StarRating rating={Number(product.avg_rating) || 0} reviews={Number(product.review_count) || 0} />
                {product.seller_uid && (
                  <span className="text-[10px] font-bold text-gray-400">by <span className="text-accent font-black">{product.seller_uid}</span></span>
                )}
              </div>
            </div>

            {/* Price Block */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Price Range (Approx.)</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-syne font-black text-3xl text-gray-900">₹{product.min_price}</span>
                <span className="text-gray-300 font-bold">–</span>
                <span className="font-syne font-black text-3xl text-gray-900">₹{product.max_price}</span>
                <span className="text-[11px] text-gray-400 font-semibold ml-1">/ {product.unit}</span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-500">
                  <Truck size={11} className="text-accent" /> MOQ: {product.min_order} {product.unit}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  {product.stock > 0 ? `${product.stock} ${product.unit} available` : "Out of Stock"}
                </span>
                {formatDeliveryTime(product.delivery_hours) && (
                  <DeliveryBadge hours={product.delivery_hours} />
                )}
              </div>
            </div>

            {/* Specs Table */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Product Specifications</p>
              <div className="divide-y divide-gray-50">
                {[
                  ["Thickness", product.thickness || "N/A"],
                  ["Width", product.width || "N/A"],
                  ["Color / Finish", product.color || "N/A"],
                  ["Product Type", product.product_type || "N/A"],
                  ["Unit", product.unit || "N/A"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2">
                    <span className="text-[11px] font-semibold text-gray-400">{label}</span>
                    <span className="text-[11px] font-black text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Applications */}
            {product.applications && product.applications.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Applications / Used For</p>
                <div className="flex flex-wrap gap-2">
                  {product.applications.map((a) => (
                    <span key={a} className="text-[10px] font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      {String(a).trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</p>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Customization / Specs Selection */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customize Your Order</p>
              <div className="space-y-4">
                {/* Thickness - Multi Select */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Thickness (Micron)
                      <span className="text-gray-300 font-semibold ml-2 normal-case tracking-normal">(select multiple)</span>
                    </label>
                    {selectedThickness.length > 0 && (
                      <button
                        onClick={() => setSelectedThickness([])}
                        className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Selector Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[12, 15, 18, 20, 23, 25, 30, 35, 40, 50, 60].map((m) => {
                      const val = `${m} Micron`;
                      const isSelected = selectedThickness.includes(val);
                      return (
                        <button
                          key={m}
                          onClick={() => toggleThickness(val)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-black border transition-all ${
                            isSelected
                              ? "bg-accent border-accent text-white shadow-sm shadow-accent/20"
                              : "bg-gray-50 border-gray-100 text-gray-500 hover:border-accent/30 hover:bg-orange-50"
                          }`}
                        >
                          {m}µ
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Chips with Remove */}
                  {selectedThickness.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest self-center mr-1">Selected:</span>
                      {selectedThickness.map((t) => (
                        <span
                          key={t}
                          className="flex items-center gap-1 bg-accent/10 text-accent text-[10px] font-black px-2.5 py-1 rounded-full border border-accent/20"
                        >
                          {t}
                          <button
                            onClick={() => toggleThickness(t)}
                            className="ml-0.5 hover:text-red-500 transition-colors"
                            title={`Remove ${t}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">
                    Manufacturer {selectedBrand && <span className="text-accent">· {selectedBrand}</span>}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Uflex", "Cosmo", "Jindal", "Polyplex", "Garware", "Any Brand"].map((b) => (
                      <button
                        key={b}
                        onClick={() => setSelectedBrand(b)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black border transition-all ${
                          selectedBrand === b
                            ? "bg-gray-900 border-gray-900 text-white shadow-sm"
                            : "bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Width */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Width (mm/inch)</label>
                    <input
                      type="text"
                      placeholder="e.g. 500mm"
                      value={selectedWidth}
                      onChange={(e) => setSelectedWidth(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Quantity ({product.unit})</label>
                    <input
                      type="number"
                      min={product.min_order || 1}
                      placeholder={`Min: ${product.min_order}`}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Block */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleOpenInquiry(product)}
                  className="w-full flex items-center justify-center gap-2 bg-accent text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest shadow-md shadow-orange-100 hover:bg-orange-600 active:scale-[0.99] transition-all"
                >
                  <Send size={16} /> Get Best Price
                </button>
                <button
                  onClick={handleAdd}
                  disabled={selectedThickness.length === 0 || !selectedWidth || !selectedBrand || !quantity}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all border ${
                    added
                      ? "bg-green-600 text-white border-green-600"
                      : selectedThickness.length === 0 || !selectedWidth || !selectedBrand || !quantity
                        ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                        : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50 active:scale-[0.99]"
                  }`}
                >
                  {added ? <><CheckCircle size={16} /> Added to Cart</> : <><ShoppingCart size={16} /> Add to Cart</>}
                </button>
              </div>
              {(selectedThickness.length === 0 || !selectedWidth || !selectedBrand || !quantity) && (
                <p className="text-[10px] text-amber-500 font-bold mt-3 flex items-center gap-1.5">
                  <Info size={11} /> Select thickness, brand, width & quantity to add to cart
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Other Sellers Comparison Section (Phase 3) */}
        {otherSellers.length > 1 && (
          <div className="mt-12 md:mt-16 bg-white rounded-[2.5rem] p-6 md:p-10 border border-black/[0.05] shadow-xl shadow-black/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <div className="relative">
                <h2 className="font-syne font-black text-3xl text-gray-900 uppercase tracking-tight">Marketplace Quotes</h2>
                <div className="w-12 h-1 bg-accent rounded-full mt-2" />
                <p className="text-[11px] text-gray-400 font-black uppercase tracking-[2px] mt-3">Verified manufacturer comparison</p>
              </div>
              <div className="bg-accent/5 px-6 py-3 rounded-2xl border border-accent/10 backdrop-blur-sm">
                <span className="text-xs font-black text-accent uppercase tracking-widest">{otherSellers.length} Direct Suppliers</span>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
              <div className="min-w-[800px] inline-block w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Seller ID</th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Spec</th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price Range</th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">MOQ / Stock</th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery</th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {otherSellers.map((s) => (
                      <tr key={s.id} className={`group hover:bg-gray-50/50 transition-all ${Number(s.seller_id) === Number(product.seller_id) && Number(s.product_id) === Number(product.id) ? 'bg-orange-50/30' : ''}`}>
                        <td className="py-5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-50 p-1">
                               <img src={getImageUrl(s.image_url)} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="font-black text-gray-900 text-sm leading-tight">{s.seller_uid || `Seller #${s.seller_id}`}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                {s.is_verified ? (
                                  <>
                                    <ShieldCheck size={10} className="text-green-500" />
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Verified Supplier</span>
                                  </>
                                ) : (
                                  <span className="text-[9px] font-bold text-gray-400 uppercase">Standard Supplier</span>
                                )}
                              </div>
                            </div>
                            {Number(s.seller_id) === Number(product.seller_id) && Number(s.product_id) === Number(product.id) && (
                                <span className="bg-accent/10 text-accent text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Current</span>
                            )}
                          </div>
                        </td>
                        <td className="py-5 pr-4 text-center">
                           <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                              {s.thickness || "N/A"}
                           </span>
                        </td>
                        <td className="py-5 pr-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                            <MapPin size={12} className="text-accent" />
                            {s.city}, {s.state}
                          </div>
                        </td>
                        <td className="py-5 pr-4">
                          <p className="font-black text-gray-900 text-sm">₹{s.price_min} - ₹{s.price_max}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">Per {product.unit}</p>
                        </td>
                        <td className="py-5 pr-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider block">Min Order: {s.moq} {product.unit}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded inline-block ${s.stock_qty > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                              {s.stock_qty > 0 ? `Ready Stock (${s.stock_qty})` : 'Out of Stock'}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 pr-4">
                           <DeliveryBadge hours={s.delivery_hours} className="!text-[8px] !px-2 !py-1" />
                        </td>
                        <td className="py-5 text-right">
                          <button 
                            onClick={() => {
                              // Use the specific product_id for this seller to get their unique image/specs
                              navigate(`/products/${s.product_id}?sellerId=${s.seller_id}`);
                              window.scrollTo(0, 0);
                            }}
                            className="px-6 py-2.5 bg-white border border-black/10 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                          >
                            View Product
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* All Variants Reflection Section */}
        {variants?.length > 0 && (
          <div className="mt-12 bg-slate-50/50 rounded-[3rem] p-8 md:p-12 border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="space-y-1">
                <h3 className="font-syne font-black text-2xl text-gray-900 uppercase tracking-tight">
                  Available Variations
                </h3>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest">
                  Explore different specifications for this material
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-px w-24 bg-slate-200 hidden md:block"></div>
                <span className="text-[10px] font-black text-accent uppercase tracking-widest bg-white px-5 py-2.5 rounded-full border border-slate-100 shadow-sm">
                  {variants.length} Variations Found
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
              {variants.map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    navigate(`/products/${v.id}`);
                    window.scrollTo(0, 0);
                  }}
                  className="bg-white p-4 rounded-[2rem] flex items-center gap-5 hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer group border border-transparent hover:border-accent/10 active:scale-[0.99]"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 p-2 relative">
                    <img
                      src={getImageUrl(v.image_url)}
                      alt={v.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = getImageUrl(product.image_url);
                      }}
                    />
                    <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors duration-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[8px] font-black bg-accent text-white px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm shadow-accent/20">
                        {v.thickness || "N/A"} Mc
                      </span>
                      <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-tighter">
                        {v.color || "Standard"}
                      </span>
                    </div>
                    <h4 className="font-black text-base text-gray-900 truncate leading-tight mb-1">
                      {v.name}
                    </h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">
                       {v.seller_uid || "Verified Manufacturer"}
                    </p>
                  </div>

                  <div className="text-right border-l border-slate-50 pl-5">
                    <div className="text-accent font-black text-sm">
                      ₹{v.min_price}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                      Per {product.unit}
                    </div>
                    <div className="mt-2 text-[8px] font-black text-green-500 uppercase flex items-center justify-end gap-1">
                      <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                      In Stock
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products Section */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-syne font-black text-ink uppercase tracking-tight">Related Products</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}

        {/* Review Section */}
        <ReviewSection productId={id} />

        {/* Inquiry Modal Integration */}
        <InquiryModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setInquiryProduct(null);
          }}
          product={inquiryProduct}
        />
      </div>
      
      {/* Sticky Mobile Bottom Quote CTA Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-100 px-6 py-4 flex items-center justify-between shadow-2xl animate-slideUp">
        <div className="min-w-0">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Min Order: {product.min_order} {product.unit}</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-syne font-black text-lg text-gray-900">₹{product.min_price}</span>
            <span className="text-gray-400 text-[10px] font-bold">/ {product.unit}</span>
          </div>
        </div>
        <button
          onClick={() => handleOpenInquiry(product)}
          className="px-6 py-3 bg-accent text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-orange-100 hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
        >
          <Send size={12} /> Get Quote
        </button>
      </div>

      <WhyChooseUs />
    </div>
  );
}
