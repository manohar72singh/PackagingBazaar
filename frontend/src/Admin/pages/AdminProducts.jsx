import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Search, 
  XCircle,
  RefreshCcw,
  Tag,
  Zap,
  ZapOff,
  TrendingUp,
  Pencil,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAllProductsAdmin, deleteProductAdmin, toggleHotDealAdmin, toggleTrendingAdmin, downloadExport } from "../../services/adminServices";
import { useNotification } from "../../context/NotificationContext";
import Pagination from "../../components/ui/Pagination";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    seller: "",
    status: "" // 'hot', 'trending'
  });
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const { notifyError, notifySuccess } = useNotification();
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  const debounceRef = React.useRef(null);
  const isMounted = React.useRef(false);

  useEffect(() => {
    loadProducts(1, search, filters);
    isMounted.current = true;
  }, []);

  // Debounced search — fires API call 400ms after user stops typing
  useEffect(() => {
    if (!isMounted.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadProducts(1, search, filters);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const loadProducts = async (page, currentSearch = search, currentFilters = filters) => {
    setLoading(true);
    try {
      const res = await fetchAllProductsAdmin(page, 10, currentSearch, currentFilters);
      if (res.success) {
        setProducts(res.products);
        setTotalPages(res.totalPages || 1);
        setCurrentPage(res.currentPage || 1);
        if (res.uniqueCategories) setCategories(res.uniqueCategories);
        if (res.uniqueSellers) setSellers(res.uniqueSellers);
      }
    } catch (err) {
      notifyError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadProducts(1, search, newFilters);
  };

  const handleClearFilters = () => {
    const cleared = { category: "", seller: "", status: "" };
    setFilters(cleared);
    loadProducts(1, search, cleared);
  };

  const handleToggleHotDeal = async (product) => {
    const newStatus = !product.is_hot_deal;
    try {
      const res = await toggleHotDealAdmin(product.product_id, newStatus);
      if (res.success) {
        notifySuccess(res.message);
        // Update local state to reflect change without full reload
        setProducts(prev => prev.map(p => 
          p.product_id === product.product_id ? { ...p, is_hot_deal: newStatus } : p
        ));
      }
    } catch (err) {
      notifyError("Failed to update Hot Deal status");
    }
  };

  const handleToggleTrending = async (product) => {
    const newStatus = !product.is_trending;
    try {
      const res = await toggleTrendingAdmin(product.product_id, newStatus);
      if (res.success) {
        notifySuccess(res.message);
        setProducts(prev => prev.map(p => 
          p.product_id === product.product_id ? { ...p, is_trending: newStatus } : p
        ));
      }
    } catch (err) {
      notifyError("Failed to update Trending status");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const res = await deleteProductAdmin(id);
        if (res.success) {
          notifySuccess("Product deleted successfully");
          loadProducts(currentPage);
        }
      } catch (err) {
        notifyError("Failed to delete product");
      }
    }
  };

  const filteredProducts = products;

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-gray-100 min-h-[400px]">
        <RefreshCcw className="animate-spin text-accent mb-4" size={40} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
            <h1 className="font-syne font-black text-3xl text-gray-900 uppercase tracking-tight">
              Product Catalog
            </h1>
          </div>
          <p className="text-gray-500 text-sm font-medium">Inspect and manage all packaging film variants listed by sellers.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              setExporting(true);
              try {
                await downloadExport("inventory");
                notifySuccess("Inventory report downloaded!");
              } catch (err) {
                notifyError("Failed to download inventory report");
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3.5 bg-white border border-gray-100 text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 hover:translate-y-[-2px] hover:shadow-xl transition-all duration-300 disabled:opacity-50 group shadow-sm"
          >
            {exporting ? (
              <RefreshCcw size={14} className="animate-spin" />
            ) : (
              <Tag size={14} className="text-accent group-hover:scale-110 transition-transform" />
            )}
            <span>Export Inventory</span>
          </button>

          <button 
            onClick={async () => {
              setExporting(true);
              try {
                await downloadExport("products");
                notifySuccess("Products report downloaded!");
              } catch (err) {
                notifyError("Failed to download report");
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:translate-y-[-2px] hover:shadow-xl active:translate-y-0 transition-all duration-300 disabled:opacity-50 group shadow-lg shadow-black/10"
          >
            {exporting ? (
              <RefreshCcw size={14} className="animate-spin" />
            ) : (
              <TrendingUp size={14} className="group-hover:scale-110 transition-transform" />
            )}
            <span>Export Products</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full mb-8">
        {/* Filters on Left */}
        <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-100 p-1.5 rounded-2xl shadow-sm">
          <div className="pl-3 pr-1 text-gray-400">
            <Filter size={16} />
          </div>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange({ ...filters, category: e.target.value })}
            className="bg-transparent border-none text-[11px] font-bold text-gray-600 outline-none py-2 pr-4 cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <div className="w-px h-4 bg-gray-100" />
          <select
            value={filters.seller}
            onChange={(e) => handleFilterChange({ ...filters, seller: e.target.value })}
            className="bg-transparent border-none text-[11px] font-bold text-gray-600 outline-none py-2 pr-4 cursor-pointer"
          >
            <option value="">All Sellers</option>
            {sellers.map(sel => <option key={sel} value={sel}>{sel}</option>)}
          </select>
          <div className="w-px h-4 bg-gray-100" />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
            className="bg-transparent border-none text-[11px] font-bold text-gray-600 outline-none py-2 pr-4 cursor-pointer"
          >
            <option value="">Any Status</option>
            <option value="hot">Hot Deals</option>
            <option value="trending">Trending</option>
          </select>

          {(filters.category || filters.seller || filters.status) && (
            <button 
              onClick={handleClearFilters}
              className="text-[10px] font-black uppercase text-accent hover:underline px-3 border-l border-gray-100"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search on Right */}
        <div className="relative group w-full xl:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm w-full outline-none focus:border-accent shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase">Product</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase">Seller</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase">Pricing</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingBag size={48} className="text-gray-200" />
                      <p className="font-syne font-black text-lg text-gray-300 uppercase tracking-wide">No Products Found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-all border-b border-gray-50">
                    <td className="px-8 py-6">
                      <div className="font-bold text-gray-900">{p.name}</div>
                      <div className="text-[10px] text-gray-400 font-black uppercase mt-0.5">
                        {p.category_name}
                        {p.thickness ? ` • ${p.thickness}` : ""}
                        {p.color ? ` • ${p.color}` : ""}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-medium">{p.seller_name}</td>
                    <td className="px-8 py-6">
                      <div className="font-black text-accent">₹{p.price_min} – ₹{p.price_max}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">per {p.unit || "kg"}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleHotDeal(p)}
                          className={`p-2.5 rounded-xl transition-colors ${
                            p.is_hot_deal 
                              ? "bg-amber-100 text-amber-600 hover:bg-amber-200" 
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                          title={p.is_hot_deal ? "Remove from Hot Deals" : "Add to Hot Deals"}
                        >
                          {p.is_hot_deal ? <Zap size={18} fill="currentColor" /> : <ZapOff size={18} />}
                        </button>
                        <button
                          onClick={() => handleToggleTrending(p)}
                          className={`p-2.5 rounded-xl transition-colors ${
                            p.is_trending 
                              ? "bg-blue-100 text-blue-600 hover:bg-blue-200" 
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          }`}
                          title={p.is_trending ? "Remove from Trending" : "Mark as Trending"}
                        >
                          <TrendingUp size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/products/edit/${p.product_id}`)}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                          title="Edit Product"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.product_id)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                          title="Delete Product"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-8 bg-slate-50/30 border-t border-gray-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => loadProducts(page, search, filters)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
