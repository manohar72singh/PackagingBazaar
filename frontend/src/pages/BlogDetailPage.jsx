import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { fetchBlogBySlug } from "../services/blogServices";
import { getImageUrl } from "../services/api";
import { Calendar, Clock, ArrowLeft, User, Tag, Loader2, Share2, Copy, Check } from "lucide-react";
import SEO from "../components/SEO";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBlogBySlug(slug)
      .then((res) => {
        if (res.success) setBlog(res.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Removed manual SEO manipulation, replaced with <SEO> and <Helmet> components

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <SEO 
        title={blog.meta_title || blog.title}
        description={blog.meta_description || blog.excerpt || blog.title}
        keywords={blog.meta_keywords || blog.tags || "packaging, packagingbazaar, blog"}
        image={img}
        type="article"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": blog.title,
            "image": [img],
            "datePublished": blog.created_at,
            "dateModified": blog.updated_at || blog.created_at,
            "author": {
              "@type": "Person",
              "name": blog.author || "PackagingBazaar Team"
            },
            "description": blog.excerpt || blog.title,
            "publisher": {
              "@type": "Organization",
              "name": "PackagingBazaar",
              "logo": {
                "@type": "ImageObject",
                "url": `${window.location.origin}/logo.png`
              }
            }
          })}
        </script>
      </Helmet>
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

        {/* Social Share Bar */}
        <div className="mt-12 pt-8 border-t border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-syne font-black text-sm uppercase tracking-wider text-ink">Share This Article</h4>
            <p className="text-[10px] text-ink3 font-bold uppercase tracking-widest mt-0.5">Spread the knowledge with your professional network</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${blog.title} - Read more at: ` + window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#25D366]/10"
            >
              WhatsApp
            </a>
            
            {/* LinkedIn */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#0077B5] hover:bg-[#00669c] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#0077B5]/10"
            >
              LinkedIn
            </a>

            {/* Twitter / X */}
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(blog.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-black hover:bg-neutral-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md"
            >
              Twitter
            </a>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-ink px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-black/[0.04] cursor-pointer"
            >
              {copied ? <Check size={12} className="text-green-600 animate-pulse" /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
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
