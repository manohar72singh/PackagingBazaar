import React, { useState, useEffect, useRef } from "react";
import { 
  Package, 
  Store, 
  Search, 
  MapPin as MapPinIcon, 
  CheckCircle2, 
  Layers, 
  Tag, 
  Image as ImageIcon, 
  FileText, 
  Plus, 
  X, 
  ChevronLeft, 
  ChevronRight,
  RefreshCcw,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  fetchAllSellers, 
  fetchCategories, 
  fetchSubCategories, 
  fetchTags, 
  fetchApplications, 
  fetchProductGroups, 
  createProductGroup, 
  addProductForSeller, 
  uploadProductImage 
} from "../../services/adminServices";
import { fetchUniqueProductNames } from "../../services/productServices";
import { useNotification } from "../../context/NotificationContext";
import { getImageUrl } from "../../services/api";

const STEPS = ["Seller", "Basic Info", "Specifications", "Applications", "Preview"];
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

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-0 mb-8">
    {STEPS.map((step, i) => (
      <div key={i} className="flex items-center">
        <div className="flex flex-col items-center gap-1.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
            i < current ? "bg-accent border-accent text-white" : i === current ? "bg-white border-accent text-accent" : "bg-white border-black/10 text-slate-400"
          }`}>
            {i < current ? <CheckCircle2 size={14} /> : i + 1}
          </div>
          <span className={`text-[10px] font-medium hidden sm:block ${i === current ? "text-accent" : "text-slate-400"}`}>
            {step}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <div className={`h-0.5 w-8 sm:w-14 mx-1 mb-4 rounded ${i < current ? "bg-accent" : "bg-black/10"}`} />
        )}
      </div>
    ))}
  </div>
);

export default function AdminAddProduct() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [productSubmitted, setProductSubmitted] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();

  const [allVerifiedSellers, setAllVerifiedSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [applications, setApplications] = useState([]);
  const [productGroups, setProductGroups] = useState([]);

  const [form, setForm] = useState({
    name: "",
    display_name: "",
    product_group_id: "",
    category: "",
    customCategory: "",
    subcategory: "",
    customSubcategory: "",
    productType: "",
    color: "",
    tag: "",
    customTag: "",
    thickness: "",
    width: "",
    minPrice: "",
    maxPrice: "",
    unit: "kg",
    minOrder: "",
    stock: "",
    deliveryTime: "",
    groupKey: "",
    newGroupName: "",
    newGroupId: "",
    productCode: "",
    description: "",
    applications: [],
    customApplications: "",
    img: "",
  });

  // Auto-generate Product ID (PB-xxx) and Variant Group ID
  useEffect(() => {
     // For Variant Group (Category_ProductType_ProductName)
     if (form.groupKey === "NEW_GROUP") {
        const matched = existingNames.find(n => 
          n.name.toLowerCase() === form.name.toLowerCase() && 
          (n.category_id == form.category || n.sub_category_id == form.subcategory)
        );

        if (matched) {
          setForm(prev => ({
            ...prev,
            groupKey: matched.group_key || "",
            product_group_id: matched.product_group_id || "",
            display_name: matched.display_name || matched.name
          }));
          return;
        }

        const cat = form.category === "Other" ? form.customCategory : categories.find(c => c.id == form.category)?.name || "";
        
        // MAPPING: Category_ProductType_ProductName (Name is lowercase with underscores)
        const typePart = form.productType ? `${form.productType}` : "";
        const namePart = form.name ? form.name.toLowerCase().replace(/\s+/g, '_') : "";
        const generatedName = `${cat}${typePart ? `_${typePart}` : ""}${namePart ? `_${namePart}` : ""}`.trim();
        
        // For ID: CAT_TYPE_NAME
        const parts = [
          cat,
          form.productType,
          form.name
        ].filter(Boolean).map(s => s.replace(/\s+/g, ""));
        const generatedId = parts.join("_").toUpperCase();
        
        setForm(prev => ({ 
          ...prev, 
          newGroupId: prev.newGroupId || generatedId,
          newGroupName: generatedName,
          display_name: generatedName
        }));
     }
  }, [form.category, form.productType, form.name, form.groupKey, form.subcategory]);

  useEffect(() => {
    // Generate PB-xxxx style ID (simplified for demo, usually fetched from server)
    if (!form.productCode) {
       const randomNum = Math.floor(100 + Math.random() * 900);
       setForm(prev => ({ ...prev, productCode: `PB${randomNum}` }));
    }
  }, []);

  const [existingNames, setExistingNames] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  const setFormVal = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (form.category && form.category !== "Other") {
      fetchSubCategories(form.category).then(res => {
        if (res.success) setSubCategories(res.data);
      });
    } else {
      setSubCategories([]);
    }
  }, [form.category]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Individual fetching with fallback to avoid whole form failure
      const sellersRes = await fetchAllSellers(1, 1000).catch(e => ({ success: false, error: e }));
      const catRes = await fetchCategories().catch(e => ({ success: false, error: e }));
      const tagRes = await fetchTags().catch(e => ({ success: false, error: e }));
      const appRes = await fetchApplications().catch(e => ({ success: false, error: e }));
      const groupRes = await fetchProductGroups().catch(e => ({ success: false, error: e }));
      const namesRes = await fetchUniqueProductNames().catch(e => ({ success: false, error: e }));

      if (sellersRes?.sellers) setAllVerifiedSellers(sellersRes.sellers);
      if (catRes?.success) setCategories(catRes.data);
      if (tagRes?.success) setTags(tagRes.data);
      if (appRes?.success) setApplications(appRes.data);
      if (groupRes?.success) setProductGroups(groupRes.data);
      if (namesRes?.success) setExistingNames(namesRes.data);

      // Log errors for debugging if any
      const errors = [];
      if (!sellersRes?.sellers) errors.push("Sellers");
      if (!catRes?.success) errors.push("Categories");
      if (!tagRes?.success) errors.push("Tags");
      if (!appRes?.success) errors.push("Applications");
      
      if (errors.length > 0) {
         console.warn("Some data failed to load:", errors.join(", "));
         // Only show notification if major stuff fails
         if (!sellersRes?.sellers || !catRes?.success) {
            notifyError("Failed to load some critical form data");
         }
      }

    } catch (err) {
      console.error("General error in loadInitialData:", err);
      notifyError("Failed to contact server");
    } finally {
      setLoading(false);
    }
  };

  const addApp = (app) => {
    if (app && !form.applications.includes(app)) {
      setFormVal("applications", [...form.applications, app]);
    }
  };

  const removeApp = (app) => setFormVal("applications", form.applications.filter((a) => a !== app));

  const handleCreateProduct = async () => {
    if (!selectedSeller) return notifyError("Select a seller");
    setLoading(true);
    try {
      const productData = {
        ...form,
        display_name: form.display_name || form.newGroupName,
        group_key: form.groupKey === "NEW_GROUP" ? form.newGroupId : form.groupKey,
        category: form.category === "Other" ? form.customCategory : categories.find((c) => c.id == form.category)?.name || form.category,
        subcategory: form.subcategory === "Other" ? form.customSubcategory : subCategories.find((s) => s.id == form.subcategory)?.name || form.subcategory,
        tag: form.tag === "Other" ? form.customTag : tags.find((t) => t.id == form.tag)?.tag_name || form.tag,
        minPrice: parseFloat(form.minPrice),
        maxPrice: parseFloat(form.maxPrice),
        minOrder: parseInt(form.minOrder),
        stock: parseInt(form.stock),
        delivery_hours: parseInt(form.deliveryTime),
      };
      const res = await addProductForSeller(selectedSeller.user_id, productData);
      if (res.success) {
        notifySuccess("Product listed!");
        setProductSubmitted(true);
      }
    } catch (err) {
      notifyError("Failed to list product");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return notifyError("Max 5MB");
    setUploading(true);
    try {
      const res = await uploadProductImage(file);
      if (res.success) {
        setFormVal("img", res.imageUrl);
        notifySuccess("Upload successful");
      }
    } catch (err) {
      notifyError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (productSubmitted) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center py-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="font-syne font-black text-3xl text-ink text-center mb-2">Product Listed!</h2>
        <p className="text-slate-600 text-center max-w-md mb-8">
          <strong>{form.name}</strong> has been successfully added for {selectedSeller?.company_name}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setProductSubmitted(false);
              setFormStep(0);
              setSelectedSeller(null);
              setForm({
                name: "", display_name: "", product_group_id: "", category: "", customCategory: "",
                subcategory: "", customSubcategory: "", tag: "", customTag: "", thickness: "",
                width: "", minPrice: "", maxPrice: "", unit: "kg", minOrder: "", stock: "",
                deliveryTime: "", groupKey: "", newGroupName: "", newGroupId: "", productCode: "",
                description: "", applications: [], customApplications: "", img: "",
              });
              loadInitialData(); // Re-fetch groups to show the one just created
            }}
            className="px-6 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
          >
            Add Another
          </button>
          <button
            onClick={() => navigate("/admin/products")}
            className="px-6 py-3 rounded-xl border border-black/15 text-sm font-medium text-ink hover:bg-slate-50 transition-colors"
          >
            View Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn max-w-[1400px] mx-auto px-4 pb-20">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        {/* Left: Form Content */}
        <div className="flex-1 w-full bg-white/80 backdrop-blur-sm border border-black/[0.05] rounded-[3rem] p-6 sm:p-12 shadow-2xl shadow-black/[0.02] flex flex-col transition-all duration-500">
          
          <StepIndicator current={formStep} />

          <div className="mt-6 flex-1 flex flex-col transition-all duration-300">
            {formStep === 0 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 text-accent rounded-2xl flex items-center justify-center font-black">01</div>
                  <h3 className="font-syne font-black text-2xl text-ink uppercase tracking-tight">Verified Manufacturer</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by brand name or location..."
                    className={inputCls + " pl-14 h-16 text-base shadow-inner shadow-black/[0.01]"}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar p-1">
                  {allVerifiedSellers
          .filter(s => 
            s.company_name?.toLowerCase().includes(search.toLowerCase()) || 
            s.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.seller_uid?.toLowerCase().includes(search.toLowerCase())
          ).map(seller => (
                    <button
                      key={seller.user_id}
                      onClick={() => setSelectedSeller(seller)}
                      className={`p-6 rounded-[2rem] border-2 text-left transition-all duration-300 relative group overflow-hidden ${selectedSeller?.user_id === seller.user_id ? "border-accent bg-accent/[0.03] shadow-lg shadow-accent/5 ring-4 ring-accent/5" : "border-black/[0.04] bg-white hover:border-accent/20 hover:shadow-xl hover:shadow-black/[0.02]"}`}
                    >
                      <div className="relative z-10">
                        <div className="font-black text-ink uppercase text-[11px] tracking-widest mb-1 group-hover:text-accent transition-colors">{seller.company_name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-black uppercase">
                          <MapPinIcon size={12} className="text-accent/60" /> {seller.city}, {seller.state}
                        </div>
                      </div>
                      <div className={`absolute top-1/2 right-6 -translate-y-1/2 transition-all duration-500 ${selectedSeller?.user_id === seller.user_id ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
                        <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/30">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formStep === 1 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 text-accent rounded-2xl flex items-center justify-center font-black">02</div>
                  <h3 className="font-syne font-black text-2xl text-ink uppercase tracking-tight">Identity & Category</h3>
                </div>
                <Field label="Commercial Listing Name" required hint="e.g. Premium White BOPP Film">
                  <div className="relative" ref={suggestionRef}>
                    <input 
                      className={inputCls + " h-16 text-lg font-black uppercase tracking-tight shadow-inner shadow-black/[0.01]"} 
                      placeholder="PRODUCT NAME" 
                      value={form.name || ""} 
                      onChange={(e) => {
                        setFormVal("name", e.target.value);
                        setShowSuggestions(true);
                      }} 
                      onFocus={() => setShowSuggestions(true)}
                    />
                    {showSuggestions && existingNames.filter(n => n.name.toLowerCase().includes(form.name.toLowerCase()) && n.name.toLowerCase() !== form.name.toLowerCase()).length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-black/[0.08] rounded-[2rem] shadow-2xl max-h-64 overflow-y-auto py-3 animate-slideDown">
                        {existingNames.filter(n => n.name.toLowerCase().includes(form.name.toLowerCase()) && n.name.toLowerCase() !== form.name.toLowerCase()).map((item, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setForm(prev => ({
                                ...prev,
                                name: item.name,
                                groupKey: item.group_key || "",
                                product_group_id: item.product_group_id || "",
                                display_name: item.display_name || item.name
                              }));
                              setShowSuggestions(false);
                            }}
                            className="w-full px-6 py-3 text-left text-xs font-black text-ink hover:bg-slate-50 hover:text-accent transition-all uppercase tracking-widest"
                          >
                            <div className="flex flex-col">
                              <span>{item.name}</span>
                              {item.display_name && <span className="text-[8px] opacity-40 normal-case font-medium">{item.display_name}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
                  <div className="space-y-3">
                    <Field label="Primary Category" required>
                      <select className={inputCls + " h-14 font-black uppercase text-xs tracking-wider"} value={form.category || ""} onChange={(e) => setFormVal("category", e.target.value)}>
                        <option value="">SELECT CATEGORY</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        <option value="Other">+ ADD NEW</option>
                      </select>
                    </Field>
                    {form.category === "Other" && (
                      <input className={inputCls + " animate-slideDown h-14 uppercase font-black text-xs tracking-widest"} placeholder="NEW CATEGORY NAME" value={form.customCategory || ""} onChange={(e) => setFormVal("customCategory", e.target.value)} />
                    )}
                  </div>

                  <div className="space-y-3">
                    <Field label="Market Subcategory" required>
                      <select className={inputCls + " h-14 font-black uppercase text-xs tracking-wider"} value={form.subcategory || ""} disabled={!form.category} onChange={(e) => setFormVal("subcategory", e.target.value)}>
                        <option value="">SELECT SUBCATEGORY</option>
                        {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        <option value="Other">+ ADD NEW</option>
                      </select>
                    </Field>
                    {form.subcategory === "Other" && (
                      <input className={inputCls + " animate-slideDown h-14 uppercase font-black text-xs tracking-widest"} placeholder="NEW SUBCATEGORY NAME" value={form.customSubcategory || ""} onChange={(e) => setFormVal("customSubcategory", e.target.value)} />
                    )}
                  </div>
                </div>


                <div className="pt-4">
                  <Field label="Curated Product Tag">
                    <div className="flex flex-wrap gap-2.5">
                      {tags.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setFormVal("tag", t.id)}
                          className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border-2 transition-all duration-300 ${
                            form.tag == t.id
                              ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-black/10 scale-105"
                              : "bg-white text-slate-400 border-black/[0.04] hover:border-slate-200"
                          }`}
                        >
                          {t.tag_name}
                        </button>
                      ))}
                      <button
                          type="button"
                          onClick={() => setFormVal("tag", "Other")}
                          className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border-2 transition-all duration-300 ${
                            form.tag === "Other"
                              ? "bg-accent text-white border-accent shadow-xl shadow-accent/20 scale-105"
                              : "bg-white text-slate-400 border-black/[0.04] hover:border-accent/20"
                          }`}
                        >
                          + CUSTOM
                        </button>
                    </div>
                  </Field>
                  {form.tag === "Other" && (
                    <div className="mt-4 animate-slideDown">
                       <input className={inputCls + " h-14 uppercase font-black text-xs tracking-widest"} placeholder="ENTER CUSTOM TAG" value={form.customTag || ""} onChange={(e) => setFormVal("customTag", e.target.value)} />
                    </div>
                  )}
                </div>

              </div>
            )}

            {formStep === 2 && (
              <div className="space-y-8 animate-fadeIn">
                 <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 text-accent rounded-2xl flex items-center justify-center font-black">03</div>
                  <h3 className="font-syne font-black text-2xl text-ink uppercase tracking-tight">Technical Data</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <Field label="Thickness (Micron)" hint="e.g. 12, 15, 23">
                    <input className={inputCls + " h-14 font-black"} placeholder="25" value={form.thickness || ""} onChange={(e) => setFormVal("thickness", e.target.value)} />
                  </Field>
                  <Field label="Roll Width (MM)" hint="Standard width">
                    <input className={inputCls + " h-14 font-black"} placeholder="1200" value={form.width || ""} onChange={(e) => setFormVal("width", e.target.value)} />
                  </Field>
                  <Field label="Product Type" hint="e.g. Metallized, Plain">
                    <input className={inputCls + " h-14 font-black"} placeholder="METALLIZED" value={form.productType || ""} onChange={(e) => setFormVal("productType", e.target.value)} />
                  </Field>
                  <Field label="Primary Color" hint="e.g. Silver, Gold">
                    <input className={inputCls + " h-14 font-black"} placeholder="SILVER" value={form.color || ""} onChange={(e) => setFormVal("color", e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-black/[0.04]">
                  <Field label="Min Price (₹)" required>
                    <input className={inputCls + " h-14 font-black text-lg text-accent"} type="number" placeholder="180" value={form.minPrice || ""} onChange={(e) => setFormVal("minPrice", e.target.value)} />
                  </Field>
                  <Field label="Max Range (₹)" required>
                    <input className={inputCls + " h-14 font-black text-lg"} type="number" placeholder="250" value={form.maxPrice || ""} onChange={(e) => setFormVal("maxPrice", e.target.value)} />
                  </Field>
                  <Field label="Min. Order (KG)" required>
                    <input className={inputCls + " h-14 font-black"} type="number" placeholder="50" value={form.minOrder || ""} onChange={(e) => setFormVal("minOrder", e.target.value)} />
                  </Field>
                </div>

                 <div className="pt-6 border-t border-black/[0.04]">
                   <Field label="Logistics & Delivery Time (Hours)" required hint="Numeric value only (e.g. 24, 48)">
                    <div className="relative">
                      <input type="number" min="1" required className={inputCls + " h-14 font-black pl-12 bg-green-50/30 border-green-100 focus:bg-white"} placeholder="e.g. 24" value={form.deliveryTime || ""} onChange={(e) => setFormVal("deliveryTime", e.target.value)} />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500">
                         <Store size={18} />
                      </div>
                    </div>
                  </Field>
                </div>
                <div className="pt-4">
                  <Field label="Visual Identity (Product Image)" required hint="High-res external link">
                    <div className="flex gap-4">
                      <input className={inputCls + " h-14 flex-1"} placeholder="PASTE IMAGE URL HERE..." value={form.img || ""} onChange={(e) => setFormVal("img", e.target.value)} />
                      <label className="shrink-0 flex items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-2xl cursor-pointer hover:bg-black transition-all shadow-xl shadow-black/20 group">
                        <ImageIcon size={20} className="group-hover:scale-110 transition-transform" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </label>
                    </div>
                  </Field>
                </div>
                <div className="pt-4">
                   <Field label="Inventory Level (KG)" required>
                    <input className={inputCls + " h-14 font-black"} type="number" placeholder="STOCK QUANTITY" value={form.stock || ""} onChange={(e) => setFormVal("stock", e.target.value)} />
                  </Field>
                </div>
              </div>
            )}

            {formStep === 3 && (
              <div className="flex flex-col gap-6">
                 <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <h3 className="font-syne font-black text-xl text-ink uppercase tracking-tight">Market Positioning</h3>
                </div>
                <Field label="Commercial Description" required>
                  <textarea className={inputCls + " h-36 pt-4 text-xs font-bold leading-relaxed"} placeholder="Highlights, USPs, and technical usage..." value={form.description || ""} onChange={(e) => setFormVal("description", e.target.value)} />
                </Field>
                <Field label="Target Applications" required hint="Press Enter to add multiple">
                   <div className="flex gap-2 mb-4">
                    <input className={inputCls} placeholder="e.g. Food Packaging..." value={form.customApplications || ""} onChange={(e) => setFormVal("customApplications", e.target.value)} 
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addApp(form.customApplications); setFormVal("customApplications", ""); } }} />
                    <button type="button" onClick={() => { addApp(form.customApplications); setFormVal("customApplications", ""); }} className="w-14 h-14 bg-accent text-white rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center"><Plus size={20}/></button>
                   </div>
                   
                   {/* Database Applications Chips */}
                   <div className="flex flex-wrap gap-2 mb-6">
                      {applications.filter(a => !form.applications.includes(a.app_name)).slice(0, 15).map(app => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => addApp(app.app_name)}
                          className="text-[10px] px-3 py-1.5 rounded-full border border-black/[0.06] bg-slate-50 text-slate-400 font-bold hover:border-accent hover:text-accent transition-all"
                        >
                          + {app.app_name}
                        </button>
                      ))}
                   </div>

                   <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 border border-black/[0.04] rounded-2xl">
                      {form.applications.length > 0 ? form.applications.map(a => (
                        <span key={a} className="px-3 py-1.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 animate-scaleIn shadow-md shadow-accent/10">
                          {a} <button onClick={() => removeApp(a)} className="hover:text-white/80 transition-colors"><X size={12}/></button>
                        </span>
                      )) : (
                        <span className="text-[10px] text-slate-400 font-bold italic">No applications added yet...</span>
                      )}
                   </div>
                </Field>
              </div>
            )}

            {formStep === 4 && (
              <div className="flex flex-col gap-8 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <h3 className="font-syne font-black text-xl text-ink uppercase tracking-tight">Final Verification</h3>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent opacity-10 rounded-full -translate-y-16 translate-x-16 blur-3xl" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-2xl font-syne font-black uppercase tracking-tight leading-tight">{form.name || "UNNAMED PRODUCT"}</h4>
                        <p className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mt-1">{selectedSeller?.company_name}</p>
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-bold text-slate-400">PRICE RANGE</div>
                         <div className="text-xl font-black">₹{form.minPrice} - ₹{form.maxPrice}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-white/10">
                       <div>
                          <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Spec</div>
                          <div className="text-xs font-bold">{form.thickness || "N/A"} Micron</div>
                       </div>
                       <div>
                          <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Stock</div>
                          <div className="text-xs font-bold">{form.stock || 0} KG</div>
                       </div>
                       <div>
                          <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Delivery</div>
                          <div className="text-xs font-bold uppercase">{form.deliveryTime ? `${form.deliveryTime} Hrs` : "N/A"}</div>
                       </div>
                       <div>
                          <div className="text-[9px] font-black text-slate-500 uppercase mb-1">Unit</div>
                          <div className="text-xs font-bold uppercase">{form.unit}</div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-black/5 bg-slate-50/50 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Field label="Product Listing ID" required hint="Marketplace SKU">
                        <input className={inputCls + " h-14 font-black text-blue-600 bg-white shadow-sm border-blue-100"} value={form.productCode || ""} onChange={(e) => setFormVal("productCode", e.target.value)} placeholder="e.g. PB001" />
                     </Field>
                     <Field label="Finalize Variant Grouping" hint="Variant collection link">
                         {(() => {
                            const matched = existingNames.find(n => 
                              n.name.toLowerCase() === form.name.toLowerCase() && 
                              (n.category_id == form.category || n.sub_category_id == form.subcategory)
                            );

                            return (
                              <div className="space-y-4">
                                <select 
                                  className={`${inputCls} h-14 font-black uppercase text-xs tracking-wider shadow-sm border-white focus:bg-white ${matched ? 'bg-orange-50 border-orange-100' : ''}`} 
                                  value={form.groupKey} 
                                  onChange={(e) => setFormVal("groupKey", e.target.value)}
                                  disabled={!!matched}
                                >
                                  {!matched && <option value="">STANDALONE PRODUCT (NO GROUP)</option>}
                                  {productGroups.map(g => (
                                    <option key={g.master_id} value={g.master_id}>{g.name} ({g.master_id})</option>
                                  ))}
                                  {!matched && <option value="NEW_GROUP">+ CREATE NEW VARIANT GROUP</option>}
                                </select>

                                {matched && (
                                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl animate-pulse">
                                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                      <ShieldCheck size={14} /> Existing Product Group Detected
                                    </p>
                                    <p className="text-[11px] text-orange-500 mt-1">
                                      A product named "{matched.name}" already exists in this category. 
                                      Linking to group "{matched.display_name}" automatically.
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                         })()}
                      </Field>
                  </div>

                  {form.groupKey === "NEW_GROUP" && (
                    <div className="p-6 bg-white border border-black/5 rounded-2xl animate-slideDown shadow-sm">
                       <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Variant Group Master Configuration</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Field label="Group Display Name">
                             <input className={inputCls + " h-12 text-xs font-bold bg-slate-50 border-none"} placeholder="GROUP NAME" value={form.newGroupName} onChange={(e) => setFormVal("newGroupName", e.target.value)} />
                          </Field>
                          <Field label="Group Master ID (Generated)">
                             <input className={inputCls + " h-12 text-xs font-bold bg-slate-50 border-none"} placeholder="MASTER ID" value={form.newGroupId} onChange={(e) => setFormVal("newGroupId", e.target.value)} />
                          </Field>
                       </div>
                    </div>
                  )}
                </div>
                <p className="text-slate-400 text-xs italic text-center px-10 leading-relaxed font-bold">Please verify all technical and commercial details. Once submitted, this product will be live for all buyers on the marketplace.</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-12 pt-8 border-t border-black/[0.06]">
              {formStep > 0 ? (
                <button type="button" onClick={() => setFormStep(s => s - 1)} className="px-8 py-4 rounded-2xl border border-black/15 text-[10px] font-black uppercase tracking-widest text-ink hover:bg-slate-50 transition-colors flex items-center gap-3">
                  <ChevronLeft size={16} /> Previous Step
                </button>
              ) : <div/>}

              {formStep < 4 ? (
                <button 
                  type="button"
                  onClick={() => {
                    if (formStep === 0 && !selectedSeller) return notifyError("Choose a manufacturer first");
                    if (formStep === 1 && (!form.name || !form.category)) return notifyError("Product name and category are required");
                    if (formStep === 2 && (!form.minPrice || !form.maxPrice || !form.stock || !form.img)) return notifyError("Specify pricing, stock and image");
                    setFormStep(s => s + 1);
                  }}
                  className="px-10 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:scale-[1.02] transition-all flex items-center gap-3"
                >
                  Next Stage <ChevronRight size={16} />
                </button>
              ) : (
                <button type="button" onClick={handleCreateProduct} disabled={loading} className="px-12 py-4 rounded-2xl bg-accent text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all flex items-center gap-3">
                  {loading ? <RefreshCcw className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} Complete & Publish
                </button>
              )}
          </div>
        </div>

        {/* Right: Live Preview Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0 sticky top-10 space-y-4">
           <div className="bg-white border border-black/[0.08] rounded-[2rem] overflow-hidden shadow-sm shadow-black/[0.02]">
              <div className="px-5 py-3 bg-slate-50 border-b border-black/[0.04]">
                <h4 className="text-[9px] font-black text-ink uppercase tracking-wider flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                   Marketplace Preview
                </h4>
              </div>
              
              {/* Product Card Mockup */}
              <div className="p-4">
                 <div className="aspect-square rounded-2xl bg-slate-100 mb-4 overflow-hidden relative group border">
                    {form.img ? (
                      <img src={getImageUrl(form.img)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                        <ImageIcon size={32} strokeWidth={1} />
                        <span className="text-[8px] font-black uppercase opacity-60">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                       <span className="px-2 py-0.5 bg-accent/90 backdrop-blur shadow-sm rounded-md text-[8px] font-black uppercase tracking-tight text-white animate-fadeIn">
                         {form.tag === "Other" ? (form.customTag || "NEW TAG") : (tags.find(t => t.id == form.tag)?.tag_name || "TAG")}
                       </span>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div>
                      <h4 className="font-syne font-black text-sm text-ink uppercase leading-tight line-clamp-1">
                        {form.name || "Your Product Title"}
                      </h4>
                      {form.description && (
                        <p className="text-[9px] text-slate-400 mt-1 line-clamp-2 leading-relaxed italic animate-fadeIn">
                          {form.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                         <span className="text-[6px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest border border-black/[0.03]">
                           {form.category === "Other" ? (form.customCategory || "NEW CATEGORY") : (categories.find(c => c.id == form.category)?.name || "CATEGORY")}
                         </span>
                         <span className="text-[6px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest border border-black/[0.03]">
                           {form.subcategory === "Other" ? (form.customSubcategory || "NEW SUB") : (subCategories.find(s => s.id == form.subcategory)?.name || "SUB")}
                         </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-black/[0.02]">
                         <span className="text-[7px] font-black bg-slate-900 text-white px-3 py-1 rounded uppercase tracking-tighter shadow-sm">{form.thickness || "--"} Mc</span>
                         <span className="text-[7px] font-black bg-slate-900 text-white px-3 py-1 rounded uppercase tracking-tighter shadow-sm">{form.width || "--"} MM</span>
                         <span className="text-[7px] font-black bg-slate-900 text-white px-3 py-1 rounded uppercase tracking-tighter shadow-sm">{form.productType || "TYPE"}</span>
                         {form.color && (
                           <span className="text-[7px] font-black bg-slate-900 text-white px-3 py-1 rounded uppercase tracking-tighter shadow-sm">{form.color}</span>
                         )}
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-2 border-t border-black/[0.03]">
                       <div className="w-full">
                         <div className="flex items-baseline justify-between mb-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">MOQ: {form.minOrder || 0} {form.unit}</p>
                            <div className="flex items-center gap-1">
                               <span className="text-sm font-black text-accent">₹{form.minPrice || "--"} - ₹{form.maxPrice || "--"}</span>
                               <span className="text-[8px] font-bold text-slate-400">/ {form.unit}</span>
                            </div>
                         </div>
                         
                         {form.deliveryTime && (
                           <div className="mt-2 p-2 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between animate-slideDown shadow-sm shadow-green-900/[0.02]">
                              <span className="text-[7px] font-black text-green-600/60 uppercase tracking-[0.2em]">Est. Delivery</span>
                              <span className="text-[8px] font-black text-green-700 uppercase">{form.deliveryTime} Hrs</span>
                           </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-black/[0.03]">
                       <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Manufactured by</p>
                       <p className="text-[9px] font-black text-ink uppercase tracking-tight line-clamp-1">{selectedSeller?.company_name || "SELECT SELLER"}</p>
                    </div>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
