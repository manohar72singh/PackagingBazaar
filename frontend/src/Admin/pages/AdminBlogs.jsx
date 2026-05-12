import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchAllBlogsAdmin, deleteBlog, toggleBlogStatus } from "../../services/blogServices";
import { 
  PlusCircle, Pencil, Trash2, Eye, EyeOff, Loader2, BookOpen, 
  Search, Filter, ChevronLeft, ChevronRight, Hash, Calendar
} from "lucide-react";

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAllBlogsAdmin();
      setBlogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteBlog(id);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Failed to delete blog.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id, title, currentStatus) => {
    try {
      const res = await toggleBlogStatus(id);
      if (res.success) {
        setBlogs((prev) => prev.map((b) => b.id === id ? { ...b, status: res.newStatus } : b));
      }
    } catch (err) {
      alert("Failed to change status.");
    }
  };

  // Filtered Data
  const filteredBlogs = useMemo(() => {
    return blogs.filter(blog => {
      const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            blog.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || blog.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || blog.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [blogs, searchTerm, statusFilter, categoryFilter]);

  // Paginated Data
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);
  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBlogs.slice(start, start + itemsPerPage);
  }, [filteredBlogs, currentPage]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter]);

  const categories = ["all", ...new Set(blogs.map(b => b.category))];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="font-syne font-black text-3xl text-ink flex items-center gap-3">
            <BookOpen className="text-accent" size={32} /> Blog Manager
          </h1>
          <p className="text-ink3 text-sm mt-1.5 font-medium">Create and refine your industry stories</p>
        </div>
        <Link
          to="/admin/blogs/add"
          className="flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-orange-600 transition-all shadow-lg shadow-accent/25 hover:-translate-y-0.5 active:scale-95"
        >
          <PlusCircle size={18} /> New Blog Post
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Articles", value: blogs.length, color: "bg-blue-50 text-blue-700", icon: <Hash size={16} /> },
          { label: "Live Posts", value: blogs.filter(b => b.status === "published").length, color: "bg-green-50 text-green-700", icon: <Eye size={16} /> },
          { label: "Drafts", value: blogs.filter(b => b.status === "draft").length, color: "bg-amber-50 text-amber-700", icon: <EyeOff size={16} /> },
          { label: "Categories", value: categories.length - 1, color: "bg-purple-50 text-purple-700", icon: <Filter size={16} /> },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-[2rem] p-5 shadow-sm border border-black/[0.03]`}>
            <div className="flex items-center justify-between mb-2">
               <span className="p-2 bg-white/50 rounded-xl">{s.icon}</span>
               <span className="font-syne font-black text-2xl">{s.value}</span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl p-4 mb-6 border border-black/[0.06] shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink3" size={18} />
          <input 
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/40 transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-surface rounded-2xl text-sm font-bold text-ink outline-none border border-transparent focus:border-accent/40"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-surface rounded-2xl text-sm font-bold text-ink outline-none border border-transparent focus:border-accent/40"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-black/[0.06]">
          <Loader2 className="animate-spin text-accent mb-4" size={40} />
          <p className="text-ink3 font-bold animate-pulse">Loading Articles...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2.5rem] border border-black/[0.06] shadow-sm">
          <BookOpen size={64} className="mx-auto mb-6 text-accent/20" />
          <h3 className="font-syne font-black text-2xl text-ink mb-2">No Articles Found</h3>
          <p className="text-ink3 text-sm mb-8 max-w-xs mx-auto">We couldn't find any blogs matching your current search or filters.</p>
          <button 
            onClick={() => { setSearchTerm(""); setStatusFilter("all"); setCategoryFilter("all"); }}
            className="text-accent font-black text-xs uppercase tracking-widest hover:underline"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[2.5rem] border border-black/[0.06] overflow-hidden shadow-sm mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface border-b border-black/[0.06]">
                    <th className="px-6 py-5 font-black text-ink text-[10px] uppercase tracking-[2px] w-16 text-center">ID</th>
                    <th className="px-8 py-5 font-black text-ink text-[10px] uppercase tracking-[2px]">Article Info</th>
                    <th className="px-6 py-5 font-black text-ink text-[10px] uppercase tracking-[2px] hidden md:table-cell">Details</th>
                    <th className="px-6 py-5 font-black text-ink text-[10px] uppercase tracking-[2px] hidden sm:table-cell">Status</th>
                    <th className="px-8 py-5 text-center font-black text-ink text-[10px] uppercase tracking-[2px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {paginatedBlogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-surface/40 transition-colors group">
                      <td className="px-6 py-6 text-center font-mono text-sm font-bold text-ink3">#{blog.id}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-black/[0.05]">
                             <img 
                               src={blog.cover_image ? (blog.cover_image.startsWith('http') ? blog.cover_image : `http://localhost:5000/${blog.cover_image}`) : "https://via.placeholder.com/100"} 
                               className="w-full h-full object-cover"
                               alt=""
                               onError={(e) => e.target.src = "https://via.placeholder.com/100"}
                             />
                          </div>
                          <div>
                            <div className="font-bold text-ink text-base group-hover:text-accent transition-colors line-clamp-1">
                               {blog.title}
                            </div>
                            <div className="text-[11px] text-ink3 mt-1 flex items-center gap-2">
                               <span className="font-mono opacity-60">/{blog.slug}</span>
                               <span className="w-1 h-1 bg-black/10 rounded-full" />
                               <span>by {blog.author}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full w-fit">
                            {blog.category}
                          </span>
                          <span className="text-[11px] text-ink3 font-medium flex items-center gap-1 mt-1">
                            <Calendar size={12} /> {new Date(blog.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 hidden sm:table-cell">
                        <button 
                          onClick={() => handleToggleStatus(blog.id, blog.title, blog.status)}
                          className={`px-3 py-1 text-[10px] font-black uppercase tracking-[2px] rounded-full inline-flex items-center gap-1.5 hover:shadow-sm transition-all ${
                            blog.status === 'published' ? 'bg-green-50 text-green-600 border border-green-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200' : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${blog.status === 'published' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                          {blog.status}
                        </button>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleToggleStatus(blog.id, blog.title, blog.status)}
                            title={blog.status === 'published' ? 'Click to Hide from Public' : 'Click to Publish to Public'}
                            className={`p-2.5 rounded-xl transition-all ${
                              blog.status === 'published' 
                                ? 'bg-blue-50 text-blue-600 hover:bg-amber-50 hover:text-amber-600' 
                                : 'bg-gray-100 text-ink3 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                          >
                            {blog.status === 'published' ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <Link to={`/admin/blogs/edit/${blog.id}`} className="p-2.5 rounded-xl bg-gray-50 text-ink3 hover:text-green-600 hover:bg-green-50 transition-all"><Pencil size={16} /></Link>
                          <button 
                            onClick={() => handleDelete(blog.id, blog.title)}
                            disabled={deletingId === blog.id}
                            className="p-2.5 rounded-xl bg-gray-50 text-ink3 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            {deletingId === blog.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <div className="text-xs text-ink3 font-bold">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBlogs.length)} of {filteredBlogs.length} results
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-2xl border border-black/[0.06] bg-white disabled:opacity-30 hover:border-accent transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-2xl text-xs font-black transition-all ${
                        currentPage === i + 1 ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-white text-ink3 hover:bg-gray-50 border border-black/[0.04]"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-2xl border border-black/[0.06] bg-white disabled:opacity-30 hover:border-accent transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
