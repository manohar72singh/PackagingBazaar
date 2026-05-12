import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchPublishedBlogs } from "../services/blogServices";
import { getImageUrl } from "../services/api";
import { 
  Calendar, Clock, Tag, ArrowRight, BookOpen, 
  Loader2, User, ChevronLeft, ChevronRight 
} from "lucide-react";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80";

// Calculate reading time from HTML content
function getReadingTime(content = "") {
  const text = content.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

// Format date + time in Indian style
function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  return { date, time };
}

// ── Featured (first big) card ─────────────────────────────────────────────
function FeaturedCard({ blog }) {
  const { date, time } = formatDateTime(blog.created_at);
  const img = blog.cover_image ? getImageUrl(blog.cover_image) : PLACEHOLDER;
  const readTime = getReadingTime(blog.content);

  return (
    <Link to={`/blog/${blog.slug}`} className="group block col-span-1 sm:col-span-2 lg:col-span-3 mb-6">
      <div className="relative rounded-2xl overflow-hidden h-[240px] sm:h-[320px] border border-black/[0.06] shadow-sm hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1">
        <img
          src={img}
          alt={blog.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="bg-accent text-white text-[10px] font-black uppercase tracking-[2px] px-4 py-1.5 rounded-full">
              {blog.category}
            </span>
            <div className="flex items-center gap-3 text-white/70 text-xs font-bold">
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {date}</span>
              <span className="flex items-center gap-1.5"><Clock size={13} /> {time}</span>
              <span className="flex items-center gap-1.5"><BookOpen size={13} /> {readTime}</span>
            </div>
          </div>
          <h2 className="font-syne font-black text-xl sm:text-2xl text-white leading-snug mb-2 group-hover:text-accent/90 transition-colors line-clamp-2 max-w-3xl">
            {blog.title}
          </h2>
          {blog.excerpt && (
            <p className="text-white/70 text-xs sm:text-sm line-clamp-2 max-w-2xl mb-4 font-medium leading-relaxed">{blog.excerpt}</p>
          )}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-white/80 text-xs font-black">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                <User size={12} className="text-accent" />
              </div>
              {blog.author}
            </div>
            <span className="flex items-center gap-1.5 text-accent font-black text-xs group/btn">
              Read Full Article <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Regular card ─────────────────────────────────────────────────────────
function BlogCard({ blog }) {
  const { date, time } = formatDateTime(blog.created_at);
  const img = blog.cover_image ? getImageUrl(blog.cover_image) : PLACEHOLDER;
  const readTime = getReadingTime(blog.content);

  return (
    <Link to={`/blog/${blog.slug}`} className="group block h-full">
      <div className="bg-white rounded-2xl overflow-hidden border border-black/[0.06] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-500 h-full flex flex-col">
        <div className="relative h-40 overflow-hidden bg-gray-100 shrink-0">
          <img
            src={img}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={(e) => { e.target.src = PLACEHOLDER; }}
          />
          <span className="absolute top-4 left-4 bg-accent text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
            {blog.category}
          </span>
          <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-ink text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <BookOpen size={10} className="text-accent" /> {readTime}
          </span>
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2.5 text-[10px] text-ink3 mb-3 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-accent" /> {date}</span>
            <span className="text-black/10">|</span>
            <span className="flex items-center gap-1.5"><Clock size={12} className="text-accent" /> {time}</span>
          </div>

          <h2 className="font-syne font-black text-sm text-ink leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
            {blog.title}
          </h2>

          {blog.excerpt && (
            <p className="text-[11px] text-ink2 leading-relaxed line-clamp-2 mb-4 flex-1 font-medium">
              {blog.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-black/[0.04]">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-ink2">
               <User size={10} className="text-accent" /> {blog.author}
            </div>
            <span className="flex items-center gap-1 text-[11px] font-black text-accent group-hover:translate-x-1 transition-transform">
              Explore <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // 1 featured + 6 grid items

  useEffect(() => {
    fetchPublishedBlogs()
      .then((res) => setBlogs(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(blogs.length / itemsPerPage);
  
  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return blogs.slice(start, start + itemsPerPage);
  }, [blogs, currentPage]);

  const [featured, ...rest] = paginatedData;

  return (
    <div className="bg-surface min-h-screen">
      {/* Hero */}
      <div className="bg-ink relative overflow-hidden py-12 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] bg-white/[0.02] rotate-12 blur-3xl rounded-full" />
          <div className="absolute top-[30%] -left-[10%] w-[40%] h-[100%] bg-accent/[0.05] -rotate-12 blur-3xl rounded-full" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 py-1 px-4 rounded-full bg-accent/10 text-accent text-[10px] font-black tracking-[3px] uppercase mb-4 border border-accent/20 shadow-sm shadow-accent/5">
            <BookOpen size={12} /> The Learning Hub
          </span>
          <h1 className="font-syne font-black text-2xl md:text-3xl text-white mb-2 leading-[1.1]">
            Packaging <span className="text-accent">Intelligence</span>
          </h1>
          <p className="text-white/60 text-xs md:text-sm max-w-xl mx-auto font-medium leading-relaxed mb-4">
            Stay ahead with the latest packaging innovations, industry shifts, and expert strategies from PackagingBazaar.
          </p>
          {!loading && blogs.length > 0 && (
            <div className="inline-flex items-center gap-2 py-1.5 px-4 bg-white/[0.03] rounded-full border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              {blogs.length} Stories Published
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="animate-spin text-accent mb-4" size={40} />
              <p className="text-ink3 font-bold animate-pulse tracking-widest uppercase text-xs">Curating Stories...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[3rem] border border-black/[0.06] shadow-sm">
              <BookOpen size={80} className="mx-auto mb-6 text-accent/10" />
              <h3 className="font-syne font-black text-3xl text-ink mb-3">Silent Library</h3>
              <p className="text-ink3 text-lg mb-0">Our editors are crafting something special.</p>
              <p className="text-ink3/60 text-sm mt-1">Check back soon for new insights!</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Grid with logic for featured on first page */}
              {featured && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <FeaturedCard blog={featured} />
                </div>
              )}

              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {rest.map((blog) => (
                    <BlogCard key={blog.id} blog={blog} />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-16 gap-6">
                  <div className="text-xs font-black uppercase tracking-[2px] text-ink3">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0, 400); }}
                      disabled={currentPage === 1}
                      className="group flex items-center gap-2 px-5 py-3 bg-white border border-black/[0.06] rounded-2xl text-xs font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all disabled:opacity-20"
                    >
                      <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Prev
                    </button>
                    
                    <div className="hidden sm:flex items-center gap-2">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => { setCurrentPage(i + 1); window.scrollTo(0, 400); }}
                          className={`w-12 h-12 rounded-2xl text-xs font-black transition-all ${
                            currentPage === i + 1 
                              ? "bg-accent text-white shadow-xl shadow-accent/25 scale-110" 
                              : "bg-white text-ink3 hover:bg-gray-50 border border-black/[0.04]"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 400); }}
                      disabled={currentPage === totalPages}
                      className="group flex items-center gap-2 px-5 py-3 bg-white border border-black/[0.06] rounded-2xl text-xs font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all disabled:opacity-20"
                    >
                      Next <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
