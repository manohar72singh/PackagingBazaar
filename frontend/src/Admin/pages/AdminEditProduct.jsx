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
  ShieldCheck,
  Save,
  Zap
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  fetchAllSellers, 
  fetchCategories, 
  fetchSubCategories, 
  fetchTags, 
  fetchApplications, 
  fetchProductGroups, 
  updateProductAdmin,
  fetchProductById,
  uploadProductImage,
  uploadProductPdf 
} from "../../services/adminServices";
import { fetchUniqueProductNames } from "../../services/productServices";
import { useNotification } from "../../context/NotificationContext";
import { getImageUrl } from "../../services/api";

const STEPS = ["Seller", "Basic Info", "Specifications", "Applications", "Review"];
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

export default function AdminEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [formStep, setFormStep] = useState(1); // Default to Basic Info for editing
  const [search, setSearch] = useState("");

  const [allVerifiedSellers, setAllVerifiedSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [applications, setApplications] = useState([]);
  const [productGroups, setProductGroups] = useState([]);
  const [existingNames, setExistingNames] = useState([]);

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
    productCode: "",
    description: "",
    applications: [],
    customApplications: "",
    img: "",
    pdf_url: "",
    is_hot_deal: false,
    is_trending: false,
    seller_name: "",
    additional_images: [],
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  const setFormVal = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    loadInitialData();
  }, [id]);

  useEffect(() => {
    if (form.category && form.category !== "Other") {
      fetchSubCategories(form.category).then(res => {
        if (res.success) setSubCategories(res.data);
      });
    }
  }, [form.category]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Fetch Product First
      const prodRes = await fetchProductById(id);
      if (!prodRes.success) {
        notifyError("Product not found");
        return navigate("/admin/products");
      }
      
      const p = prodRes.data;
      
      // Fetch others in parallel
      const [sellersRes, catRes, tagRes, appRes, groupRes, namesRes] = await Promise.all([
        fetchAllSellers(1, 1000).catch(() => ({})),
        fetchCategories().catch(() => ({})),
        fetchTags().catch(() => ({})),
        fetchApplications().catch(() => ({})),
        fetchProductGroups().catch(() => ({})),
        fetchUniqueProductNames().catch(() => ({}))
      ]);

      if (sellersRes?.sellers) {
        setAllVerifiedSellers(sellersRes.sellers);
        // Try to find seller by id (loose comparison)
        const sId = p.seller_id;
        const seller = sellersRes.sellers.find(s => s.id == sId || s.seller_id == sId);
        if (seller) setSelectedSeller(seller);
      }
      
      if (catRes?.success) setCategories(catRes.data);
      if (tagRes?.success) setTags(tagRes.data);
      if (appRes?.success) setApplications(appRes.data);
      if (groupRes?.success) setProductGroups(groupRes.data);
      if (namesRes?.success) setExistingNames(namesRes.data);

      // Fetch initial subcategories for the product's category
      if (p.category_id) {
        const subRes = await fetchSubCategories(p.category_id).catch(() => ({}));
        if (subRes?.success) setSubCategories(subRes.data);
      }

      // Map Product Data to Form
      setForm({
        name: p.name || "",
        display_name: p.display_name || "",
        product_group_id: p.product_group_id || "",
        category: p.category_id || "",
        subcategory: p.sub_category_id || "",
        productType: p.product_type || "",
        color: p.color || "",
        tag: p.tag_id || "",
        thickness: p.thickness || "",
        width: p.width || "",
        minPrice: p.min_price || "",
        maxPrice: p.max_price || "",
        unit: p.unit || "kg",
        minOrder: p.min_order || "",
        stock: p.stock || 0,
        deliveryTime: p.delivery_time || "",
        groupKey: p.group_key || "",
        productCode: p.product_code || "",
        description: p.description || "",
        applications: p.applications || [],
        customApplications: "",
        img: p.image_url || "",
        pdf_url: p.pdf_url || "",
        is_hot_deal: p.is_hot_deal === 1,
        is_trending: p.is_trending === 1,
        seller_name: p.seller_name || "",
        additional_images: p.additional_images || [],
      });

    } catch (err) {
      console.error(err);
      notifyError("Failed to load product data");
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

  const handleUpdateProduct = async () => {
    setSubmitting(true);
    try {
      const productData = {
        ...form,
        sub_category_id: form.subcategory,
        tag_id: form.tag,
        minPrice: parseFloat(form.minPrice),
        maxPrice: parseFloat(form.maxPrice),
        minOrder: parseInt(form.minOrder),
        stock: parseInt(form.stock),
        is_hot_deal: form.is_hot_deal,
        is_trending: form.is_trending,
      };
      
      const res = await updateProductAdmin(id, productData);
      if (res.success) {
        notifySuccess("Product updated!");
        navigate("/admin/products");
      }
    } catch (err) {
      notifyError("Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
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

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") return notifyError("Only PDF files are allowed");
    if (file.size > 10 * 1024 * 1024) return notifyError("Max 10MB");
    setPdfUploading(true);
    try {
      const res = await uploadProductPdf(file);
      if (res.success) {
        setFormVal("pdf_url", res.pdfUrl);
        notifySuccess("PDF Upload successful");
      }
    } catch (err) {
      notifyError("PDF Upload failed");
    } finally {
      setPdfUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-gray-100 min-h-[500px]">
        <RefreshCcw className="animate-spin text-accent mb-4" size={40} />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Product Details...</p>
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
                  <h3 className="font-syne font-black text-2xl text-ink uppercase tracking-tight">Assigned Manufacturer</h3>
                </div>
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by brand name or location..."
                    className={inputCls + " pl-14 h-16 text-base"}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                  {allVerifiedSellers.filter(s => !search || s.company_name.toLowerCase().includes(search.toLowerCase())).map(seller => (
                    <button
                      key={seller.user_id}
                      onClick={() => setSelectedSeller(seller)}
                      className={`p-6 rounded-[2rem] border-2 text-left transition-all duration-300 relative ${selectedSeller?.id === seller.id ? "border-accent bg-accent/[0.03]" : "border-black/[0.04] bg-white"}`}
                    >
                      <div className="font-black text-ink uppercase text-[11px] tracking-widest mb-1">{seller.company_name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-black uppercase">
                        <MapPinIcon size={12} className="text-accent/60" /> {seller.city}, {seller.state}
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
                <Field label="Commercial Listing Name" required>
                  <input 
                    className={inputCls + " h-16 text-lg font-black uppercase tracking-tight"} 
                    placeholder="PRODUCT NAME" 
                    value={form.name || ""} 
                    onChange={(e) => setFormVal("name", e.target.value)} 
                  />
                </Field>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
                  <Field label="Primary Category" required>
                    <select className={inputCls + " h-14 font-black uppercase text-xs tracking-wider"} value={form.category || ""} onChange={(e) => setFormVal("category", e.target.value)}>
                      <option value="">SELECT CATEGORY</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>

                  <Field label="Market Subcategory" required>
                    <select className={inputCls + " h-14 font-black uppercase text-xs tracking-wider"} value={form.subcategory || ""} disabled={!form.category} onChange={(e) => setFormVal("subcategory", e.target.value)}>
                      <option value="">SELECT SUBCATEGORY</option>
                      {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
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
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-400 border-black/[0.04]"
                          }`}
                        >
                          {t.tag_name}
                        </button>
                      ))}
                    </div>
                  </Field>
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
                   <Field label="Thickness (Micron)">
                    <input className={inputCls + " h-14 font-black"} placeholder="25" value={form.thickness || ""} onChange={(e) => setFormVal("thickness", e.target.value)} />
                  </Field>
                  <Field label="Roll Width (MM)">
                    <input className={inputCls + " h-14 font-black"} placeholder="1200" value={form.width || ""} onChange={(e) => setFormVal("width", e.target.value)} />
                  </Field>
                  <Field label="Product Type">
                    <input className={inputCls + " h-14 font-black"} placeholder="METALLIZED" value={form.productType || ""} onChange={(e) => setFormVal("productType", e.target.value)} />
                  </Field>
                  <Field label="Primary Color">
                    <input className={inputCls + " h-14 font-black"} placeholder="SILVER" value={form.color || ""} onChange={(e) => setFormVal("color", e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-black/[0.04]">
                  <Field label="Min Price (₹)" required>
                    <input className={inputCls + " h-14 font-black text-lg text-accent"} type="number" value={form.minPrice || ""} onChange={(e) => setFormVal("minPrice", e.target.value)} />
                  </Field>
                  <Field label="Max Range (₹)" required>
                    <input className={inputCls + " h-14 font-black text-lg"} type="number" value={form.maxPrice || ""} onChange={(e) => setFormVal("maxPrice", e.target.value)} />
                  </Field>
                  <Field label="Min. Order (KG)" required>
                    <input className={inputCls + " h-14 font-black"} type="number" value={form.minOrder || ""} onChange={(e) => setFormVal("minOrder", e.target.value)} />
                  </Field>
                </div>

                <div className="pt-6 border-t border-black/[0.04]">
                   <Field label="Logistics & Delivery">
                    <input className={inputCls + " h-14 font-black"} placeholder="e.g. 3-5 Business Days" value={form.deliveryTime || ""} onChange={(e) => setFormVal("deliveryTime", e.target.value)} />
                  </Field>
                </div>
                <div className="pt-4">
                  <Field label="Visual Identity (Product Image)" required>
                    <div className="flex gap-4">
                      <input className={inputCls + " h-14 flex-1"} placeholder="IMAGE URL..." value={form.img || ""} onChange={(e) => setFormVal("img", e.target.value)} />
                      <label className="shrink-0 flex items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-2xl cursor-pointer hover:bg-black transition-all">
                        <ImageIcon size={20} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </label>
                    </div>
                  </Field>
                </div>

                <div className="pt-4 border-t border-black/[0.04]">
                  <Field label="Additional Gallery Images (Max 3)" hint="Add specifications or product angles">
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      {[0, 1, 2].map((index) => {
                        const imgUrl = form.additional_images?.[index];
                        return (
                          <div key={index} className="relative aspect-square rounded-2xl border-2 border-dashed border-black/[0.1] bg-slate-50/50 flex flex-col items-center justify-center overflow-hidden hover:border-accent/40 transition-colors group">
                            {imgUrl ? (
                              <>
                                <img src={getImageUrl(imgUrl)} className="w-full h-full object-cover animate-fadeIn" alt="" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(form.additional_images || [])];
                                    updated.splice(index, 1);
                                    setFormVal("additional_images", updated);
                                  }}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-lg z-10 animate-scaleIn"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 text-center hover:bg-slate-100/50 transition-colors">
                                <Plus size={18} className="text-slate-400 group-hover:text-accent transition-colors" />
                                <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Slot {index + 1}</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    if (file.size > 5 * 1024 * 1024) return notifyError("Max 5MB");
                                    setUploading(true);
                                    try {
                                      const res = await uploadProductImage(file);
                                      if (res.success) {
                                        const updated = [...(form.additional_images || [])];
                                        updated[index] = res.imageUrl;
                                        setFormVal("additional_images", updated);
                                        notifySuccess(`Slot ${index + 1} uploaded`);
                                      }
                                    } catch (err) {
                                      notifyError("Upload failed");
                                    } finally {
                                      setUploading(false);
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Field>
                </div>

                <div className="pt-4">
                   <Field label="Inventory Level (KG)" required>
                    <input className={inputCls + " h-14 font-black"} type="number" value={form.stock || ""} onChange={(e) => setFormVal("stock", e.target.value)} />
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
                  <textarea className={inputCls + " h-36 pt-4 text-xs font-bold leading-relaxed"} value={form.description || ""} onChange={(e) => setFormVal("description", e.target.value)} />
                </Field>
                <Field label="Technical Specifications Document (PDF)" hint="Attach extra details (Max 10MB)">
                  <div className="flex gap-4">
                    <input className={inputCls + " h-14 flex-1"} placeholder="PASTE PDF URL HERE..." value={form.pdf_url || ""} onChange={(e) => setFormVal("pdf_url", e.target.value)} />
                    <label className="shrink-0 flex items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-2xl cursor-pointer hover:bg-black transition-all shadow-xl shadow-black/20 group">
                      <FileText size={20} className="group-hover:scale-110 transition-transform" />
                      <input type="file" className="hidden" accept="application/pdf" onChange={handlePdfUpload} />
                    </label>
                  </div>
                  {pdfUploading && <span className="text-xs text-accent animate-pulse font-bold">Uploading PDF...</span>}
                </Field>
                <Field label="Target Applications" required>
                   <div className="flex gap-2 mb-4">
                    <input className={inputCls} placeholder="Add application..." value={form.customApplications || ""} onChange={(e) => setFormVal("customApplications", e.target.value)} 
                      onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addApp(form.customApplications); setFormVal("customApplications", ""); } }} />
                    <button type="button" onClick={() => { addApp(form.customApplications); setFormVal("customApplications", ""); }} className="w-14 h-14 bg-accent text-white rounded-xl flex items-center justify-center"><Plus size={20}/></button>
                   </div>
                   
                   <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 border border-black/[0.04] rounded-2xl">
                      {form.applications.map(a => (
                        <span key={a} className="px-3 py-1.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                          {a} <button onClick={() => removeApp(a)}><X size={12}/></button>
                        </span>
                      ))}
                   </div>
                </Field>
              </div>
            )}

            {formStep === 4 && (
              <div className="flex flex-col gap-8 py-4">
                <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-2xl font-syne font-black uppercase tracking-tight">{form.name}</h4>
                        <p className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mt-1">{selectedSeller?.company_name}</p>
                      </div>
                      <div className="text-right">
                         <div className="text-xs font-bold text-slate-400">PRICE RANGE</div>
                         <div className="text-xl font-black">₹{form.minPrice} - ₹{form.maxPrice}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-black/5 bg-slate-50/50 space-y-6">
                   <Field label="Product Listing ID" required>
                      <input className={inputCls + " h-14 font-black"} value={form.productCode || ""} onChange={(e) => setFormVal("productCode", e.target.value)} />
                   </Field>
                   <Field label="Variant Group Master ID">
                      <input className={inputCls + " h-14 font-black"} value={form.groupKey || ""} onChange={(e) => setFormVal("groupKey", e.target.value)} placeholder="GROUP_ID" />
                   </Field>

                   <div className="grid grid-cols-2 gap-6 pt-6 border-t border-black/[0.04]">
                      <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                         <div className="flex items-center gap-3">
                            <Zap size={18} className="text-amber-600" />
                            <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">Hot Deal</span>
                         </div>
                         <button 
                            type="button"
                            onClick={() => setFormVal("is_hot_deal", !form.is_hot_deal)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${form.is_hot_deal ? "bg-amber-500" : "bg-slate-300"}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.is_hot_deal ? "left-7" : "left-1"}`} />
                         </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                         <div className="flex items-center gap-3">
                            <ShieldCheck size={18} className="text-blue-600" />
                            <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">Trending</span>
                         </div>
                         <button 
                            type="button"
                            onClick={() => setFormVal("is_trending", !form.is_trending)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${form.is_trending ? "bg-blue-500" : "bg-slate-300"}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.is_trending ? "left-7" : "left-1"}`} />
                         </button>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-12 pt-8 border-t border-black/[0.06]">
              <button type="button" onClick={() => formStep > 0 ? setFormStep(s => s - 1) : navigate("/admin/products")} className="px-8 py-4 rounded-2xl border border-black/15 text-[10px] font-black uppercase tracking-widest text-ink hover:bg-slate-50 transition-colors flex items-center gap-3">
                <ChevronLeft size={16} /> {formStep === 0 ? "Cancel" : "Previous Step"}
              </button>

              {formStep < 4 ? (
                <button 
                  type="button"
                  onClick={() => setFormStep(s => s + 1)}
                  className="px-10 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center gap-3"
                >
                  Next Stage <ChevronRight size={16} />
                </button>
              ) : (
                <button type="button" onClick={handleUpdateProduct} disabled={submitting} className="px-12 py-4 rounded-2xl bg-accent text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center gap-3">
                  {submitting ? <RefreshCcw className="animate-spin" size={18}/> : <Save size={18}/>} Save Changes
                </button>
              )}
          </div>
        </div>

        {/* Right: Live Preview Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0 sticky top-10 space-y-4">
           <div className="bg-white border border-black/[0.08] rounded-[2rem] overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-slate-50 border-b border-black/[0.04]">
                <h4 className="text-[9px] font-black text-ink uppercase tracking-wider">Preview Changes</h4>
              </div>
              <div className="p-4">
                 <div className="aspect-square rounded-2xl bg-slate-100 mb-4 overflow-hidden border">
                    {form.img && <img src={getImageUrl(form.img)} className="w-full h-full object-cover" alt="" />}
                 </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                       <span className="px-2 py-0.5 bg-accent/90 backdrop-blur shadow-sm rounded-md text-[8px] font-black uppercase tracking-tight text-white animate-fadeIn">
                         {tags.find(t => t.id == form.tag)?.tag_name || "NO TAG"}
                       </span>
                    </div>
                    <h4 className="font-syne font-black text-sm text-ink uppercase leading-tight line-clamp-1">{form.name || "Product Title"}</h4>
                    
                    {form.description && (
                      <p className="text-[9px] text-slate-400 mt-1 line-clamp-2 leading-relaxed italic animate-fadeIn">
                        {form.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                       <span className="text-[6px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest border border-black/[0.03]">
                         {categories.find(c => c.id == form.category)?.name || "CATEGORY"}
                       </span>
                       <span className="text-[6px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest border border-black/[0.03]">
                         {subCategories.find(s => s.id == form.subcategory)?.name || "SUB"}
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

                    <div className="flex items-baseline justify-between pt-2 border-t border-black/[0.03]">
                       <span className="text-sm font-black text-accent">₹{form.minPrice || "--"} - ₹{form.maxPrice || "--"}</span>
                       <span className="text-[8px] font-bold text-slate-400">/ {form.unit}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-black/[0.03]">
                       <div className="bg-slate-50 p-2 rounded-lg border border-black/[0.02]">
                          <p className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">Stock</p>
                          <p className="text-[9px] font-black text-ink">{form.stock} {form.unit}</p>
                       </div>
                       <div className="bg-slate-50 p-2 rounded-lg border border-black/[0.02]">
                          <p className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">Code</p>
                          <p className="text-[9px] font-black text-ink">{form.productCode || "N/A"}</p>
                       </div>
                    </div>

                    <div className="pt-3 border-t border-black/[0.03]">
                       <p className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">Logistics</p>
                       <p className="text-[9px] font-black text-accent uppercase tracking-tight">{form.deliveryTime || "NOT SPECIFIED"}</p>
                    </div>

                    <div className="pt-3 border-t border-black/[0.03]">
                       <p className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">Manufacturer</p>
                       <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-accent/10 text-accent rounded flex items-center justify-center">
                             <Store size={10} />
                          </div>
                          <p className="text-[9px] font-black text-ink uppercase tracking-tight line-clamp-1">{selectedSeller?.company_name || form.seller_name || "UNKNOWN"}</p>
                       </div>
                    </div>

                    {(form.is_hot_deal || form.is_trending) && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {form.is_hot_deal && (
                          <span className="text-[7px] font-black bg-amber-500 text-white px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tighter shadow-sm">
                             <Zap size={8} fill="currentColor" /> Hot Deal
                          </span>
                        )}
                        {form.is_trending && (
                          <span className="text-[7px] font-black bg-blue-500 text-white px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tighter shadow-sm">
                             <ShieldCheck size={8} /> Trending
                          </span>
                        )}
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
