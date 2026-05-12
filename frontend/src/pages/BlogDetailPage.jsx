import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchBlogBySlug } from "../services/blogServices";
import { getImageUrl } from "../services/api";
import { Calendar, Clock, ArrowLeft, User, Tag, Loader2 } from "lucide-react";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchBlogBySlug(slug)
      .then((res) => {
        if (res.success) setBlog(res.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={36} />
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-syne font-black text-4xl text-ink mb-3">Blog Not Found</h1>
        <p className="text-ink2 mb-6">This post may have been removed or does not exist.</p>
        <Link to="/blog" className="bg-accent text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-orange-600 transition-colors">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  const d = new Date(blog.created_at);
  const date = d.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  const img = blog.cover_image ? getImageUrl(blog.cover_image) : PLACEHOLDER;

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Cover */}
      <div className="relative h-[340px] sm:h-[440px] overflow-hidden bg-ink">
        <img
          src={img}
          alt={blog.title}
          className="w-full h-full object-cover opacity-60"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-10 max-w-4xl mx-auto">
          <span className="inline-block bg-accent text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            {blog.category}
          </span>
          <h1 className="font-syne font-black text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
            {blog.title}
          </h1>
        </div>
      </div>

      {/* Meta bar */}
      <div className="bg-white border-b border-black/[0.06]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4 text-sm text-ink3">
          <Link to="/blog" className="flex items-center gap-1.5 text-accent font-bold hover:underline">
            <ArrowLeft size={14} /> Blog
          </Link>
          <span className="text-black/20 hidden sm:block">|</span>
          <span className="flex items-center gap-1.5">
            <User size={13} className="text-accent" /> {blog.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="text-accent" /> {date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-accent" /> {time}
          </span>
          {blog.tags && (
            <span className="flex items-center gap-1.5">
              <Tag size={13} className="text-accent" /> {blog.tags}
            </span>
          )}
        </div>
      </div>

      {/* Article content */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-lg sm:text-xl text-ink2 leading-relaxed mb-8 font-light border-l-4 border-accent pl-5 italic">
            {blog.excerpt}
          </p>
        )}

        {/* Rich content rendered as HTML */}
        <div
          className="blog-content"
          style={{
            fontSize: "1rem", lineHeight: "1.8", color: "#374151"
          }}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </article>

      {/* Back CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-ink rounded-3xl p-8 text-center">
          <h3 className="font-syne font-black text-2xl text-white mb-2">Read More Articles</h3>
          <p className="text-white/60 text-sm mb-5">Explore more insights from the PackagingBazaar team.</p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-full font-black text-sm hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft size={14} /> All Blog Posts
          </Link>
        </div>
      </div>
    </div>
  );
}
