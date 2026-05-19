import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createBlog, updateBlog, fetchBlogByIdAdmin } from "../../services/blogServices";
import { getImageUrl } from "../../services/api";
import {
  Save, Loader2, ArrowLeft, Upload, Link as LinkIcon, Image,
  Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2,
  AlignLeft, AlignCenter, Quote, Code, Minus, 
  Strikethrough, Undo, Redo, Eraser,
  Subscript as SubIcon, Superscript as SuperIcon
} from "lucide-react";

// ─── Rich Text Toolbar ─────────────────────────────────────────────────────
function ToolbarBtn({ title, onClick, children, active }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded-lg transition-all ${
        active ? "bg-accent text-white" : "hover:bg-black/5 text-ink2"
      }`}
    >
      {children}
    </button>
  );
}

function RichEditor({ value, onChange }) {
  const editorRef = useRef(null);

  // Sync incoming value once on mount
  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML === "") {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    syncContent();
  };

  const syncContent = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  const insertHR = () => {
    exec("insertHTML", "<hr style='border:none;border-top:2px solid #eee;margin:1.5rem 0;'/>");
  };

  return (
    <div className="border border-black/[0.1] rounded-2xl overflow-hidden focus-within:border-accent transition-all">
      {/* Toolbar */}
      <div className="bg-surface border-b border-black/[0.08] px-3 py-2 flex flex-wrap gap-0.5">
        <ToolbarBtn title="Undo" onClick={() => exec("undo")}><Undo size={14} /></ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => exec("redo")}><Redo size={14} /></ToolbarBtn>
        <div className="w-px h-5 bg-black/10 mx-1 self-center" />
        
        <ToolbarBtn title="Bold" onClick={() => exec("bold")}><Bold size={14} /></ToolbarBtn>
        <ToolbarBtn title="Italic" onClick={() => exec("italic")}><Italic size={14} /></ToolbarBtn>
        <ToolbarBtn title="Underline" onClick={() => exec("underline")}><Underline size={14} /></ToolbarBtn>
        <ToolbarBtn title="Strikethrough" onClick={() => exec("strikeThrough")}><Strikethrough size={14} /></ToolbarBtn>
        <div className="w-px h-5 bg-black/10 mx-1 self-center" />
        
        <ToolbarBtn title="Heading 1" onClick={() => exec("formatBlock", "H1")}><Heading1 size={14} /></ToolbarBtn>
        <ToolbarBtn title="Heading 2" onClick={() => exec("formatBlock", "H2")}><Heading2 size={14} /></ToolbarBtn>
        <ToolbarBtn title="Paragraph" onClick={() => exec("formatBlock", "P")}><AlignLeft size={14} /></ToolbarBtn>
        <div className="w-px h-5 bg-black/10 mx-1 self-center" />
        
        <ToolbarBtn title="Bullet List" onClick={() => exec("insertUnorderedList")}><List size={14} /></ToolbarBtn>
        <ToolbarBtn title="Numbered List" onClick={() => exec("insertOrderedList")}><ListOrdered size={14} /></ToolbarBtn>
        <div className="w-px h-5 bg-black/10 mx-1 self-center" />
        
        <ToolbarBtn title="Subscript" onClick={() => exec("subscript")}><SubIcon size={14} /></ToolbarBtn>
        <ToolbarBtn title="Superscript" onClick={() => exec("superscript")}><SuperIcon size={14} /></ToolbarBtn>
        <div className="w-px h-5 bg-black/10 mx-1 self-center" />

        <ToolbarBtn title="Blockquote" onClick={() => exec("formatBlock", "BLOCKQUOTE")}><Quote size={14} /></ToolbarBtn>
        <ToolbarBtn title="Code" onClick={() => exec("formatBlock", "PRE")}><Code size={14} /></ToolbarBtn>
        <ToolbarBtn title="Center" onClick={() => exec("justifyCenter")}><AlignCenter size={14} /></ToolbarBtn>
        <ToolbarBtn title="Insert Link" onClick={insertLink}><LinkIcon size={14} /></ToolbarBtn>
        <ToolbarBtn title="Divider" onClick={insertHR}><Minus size={14} /></ToolbarBtn>
        
        <div className="w-px h-5 bg-black/10 mx-1 self-center" />
        <ToolbarBtn title="Clear Formatting" onClick={() => exec("removeFormat")}><Eraser size={14} /></ToolbarBtn>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncContent}
        onBlur={syncContent}
        className="h-[400px] overflow-y-auto p-5 text-sm text-ink leading-relaxed focus:outline-none
          [&_h1]:text-3xl [&_h1]:font-black [&_h1]:font-syne [&_h1]:text-ink [&_h1]:mb-3 [&_h1]:mt-4
          [&_h2]:text-2xl [&_h2]:font-black [&_h2]:font-syne [&_h2]:text-ink [&_h2]:mb-2 [&_h2]:mt-3
          [&_p]:mb-3 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
          [&_li]:mb-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-ink2 [&_blockquote]:my-3
          [&_pre]:bg-gray-100 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-3
          [&_a]:text-accent [&_a]:underline
          [&_strong]:font-bold [&_strong]:text-ink"
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminAddEditBlog() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: "", excerpt: "", content: "", author: "PackagingBazaar Team",
    category: "General", tags: "", status: "draft",
    image_url: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    custom_slug: "",
  });
  const [imageMode, setImageMode] = useState("url"); // 'url' | 'upload'
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    fetchBlogByIdAdmin(id)
      .then((res) => {
        if (res.success) {
          const b = res.data;
          setForm({
            title: b.title, excerpt: b.excerpt || "", content: b.content,
            author: b.author, category: b.category, tags: b.tags || "",
            status: b.status, image_url: b.image_type === "url" ? b.cover_image || "" : "",
            meta_title: b.meta_title || "",
            meta_description: b.meta_description || "",
            meta_keywords: b.meta_keywords || "",
            custom_slug: b.slug || "",
          });
          setImageMode(b.image_type || "url");
          if (b.image_type === "upload" && b.cover_image) {
            setUploadPreview(getImageUrl(b.cover_image));
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Auto-generate slug from title for new posts
  useEffect(() => {
    if (!isEdit && form.title) {
      const generated = form.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setForm(prev => ({ ...prev, custom_slug: generated }));
    }
  }, [form.title, isEdit]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.content.trim() || form.content === "<br>") e.content = "Content is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== "image_url") fd.append(k, v);
      });

      if (imageMode === "upload" && uploadFile) {
        fd.append("cover_image", uploadFile);
      } else if (imageMode === "url" && form.image_url) {
        fd.append("image_url", form.image_url);
      }

      const res = isEdit ? await updateBlog(id, fd) : await createBlog(fd);
      if (res.success) {
        navigate("/admin/blogs");
      } else {
        alert(res.message || "Failed to save blog.");
      }
    } catch (err) {
      alert("Error saving blog.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => navigate("/admin/blogs")}
          className="p-2 rounded-xl bg-surface border border-black/[0.08] hover:border-accent/30 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-syne font-black text-2xl sm:text-3xl text-ink">
            {isEdit ? "Edit Blog Post" : "New Blog Post"}
          </h1>
          <p className="text-ink3 text-sm">{isEdit ? "Update your article" : "Write and publish a new article"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-ink2 mb-2">
                Blog Title *
              </label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Enter a compelling blog title..."
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:border-accent transition-all bg-white ${errors.title ? "border-red-400" : "border-black/[0.1]"}`}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-ink2 mb-2">
                Short Excerpt <span className="font-normal text-ink3">(shown in cards)</span>
              </label>
              <textarea
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                rows={2}
                placeholder="Brief summary of the article (1-2 sentences)..."
                className="w-full px-4 py-3 rounded-2xl border border-black/[0.1] text-sm focus:outline-none focus:border-accent transition-all bg-white resize-none"
              />
            </div>

            {/* Rich Content Editor */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-ink2 mb-2">
                Article Content *
              </label>
              <RichEditor value={form.content} onChange={(v) => set("content", v)} />
              {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
              <p className="text-[11px] text-ink3 mt-1.5">
                Use the toolbar for Bold, Headings, Lists, Quotes etc. Content will display exactly as formatted.
              </p>
            </div>

            {/* Search Engine Optimization (SEO) Settings */}
            <div className="bg-white border border-black/[0.06] rounded-[2rem] p-6 space-y-5 shadow-sm">
              <div className="border-b border-black/[0.05] pb-3 mb-2">
                <h3 className="font-syne font-black text-sm uppercase tracking-widest text-ink flex items-center gap-2">
                  <Image size={16} className="text-accent" /> Search Engine Optimization (SEO)
                </h3>
                <p className="text-[10px] text-ink3 font-bold uppercase tracking-wider mt-0.5">
                  Customize how your article appears on Google Search results
                </p>
              </div>

              {/* Custom SEO URL Slug */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-ink2 mb-1.5 ml-0.5">
                  URL Slug Override
                </label>
                <div className="flex items-center bg-gray-50 border border-black/[0.08] rounded-xl overflow-hidden focus-within:border-accent transition-all">
                  <span className="bg-gray-100/80 text-[10px] font-black uppercase tracking-widest px-3.5 py-3 border-r border-black/[0.08] select-none text-ink3">
                    /blog/
                  </span>
                  <input
                    value={form.custom_slug}
                    onChange={(e) => set("custom_slug", e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    placeholder="custom-url-slug"
                    className="flex-1 bg-transparent px-3 py-2 text-xs font-bold text-ink focus:outline-none"
                  />
                </div>
                <p className="text-[9px] text-ink3 mt-1 ml-0.5 font-semibold">
                  Auto-generated from title if left blank. Only lowercase letters, numbers, and dashes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custom Meta Title */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-ink2 mb-1.5 ml-0.5">
                    Custom Meta Title
                  </label>
                  <input
                    value={form.meta_title}
                    onChange={(e) => set("meta_title", e.target.value)}
                    placeholder="Leave blank to use Blog Title..."
                    maxLength={60}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/[0.1] text-xs font-semibold focus:outline-none focus:border-accent bg-white"
                  />
                  <div className="flex justify-between items-center mt-1 ml-0.5">
                    <span className="text-[9px] text-ink3 font-medium">Recommended: Under 60 chars</span>
                    <span className="text-[9px] font-bold text-ink2">{form.meta_title?.length || 0}/60</span>
                  </div>
                </div>

                {/* Custom Meta Keywords */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-ink2 mb-1.5 ml-0.5">
                    SEO Keywords
                  </label>
                  <input
                    value={form.meta_keywords}
                    onChange={(e) => set("meta_keywords", e.target.value)}
                    placeholder="e.g. rigid box price, luxury packaging supplier"
                    className="w-full px-4 py-2.5 rounded-xl border border-black/[0.1] text-xs font-semibold focus:outline-none focus:border-accent bg-white"
                  />
                  <p className="text-[9px] text-ink3 mt-1 ml-0.5 font-semibold">
                    Comma-separated terms targeting search.
                  </p>
                </div>
              </div>

              {/* Custom Meta Description */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-ink2 mb-1.5 ml-0.5">
                  Custom Meta Description
                </label>
                <textarea
                  value={form.meta_description}
                  onChange={(e) => set("meta_description", e.target.value)}
                  placeholder="Leave blank to use Short Excerpt..."
                  rows={2}
                  maxLength={160}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/[0.1] text-xs focus:outline-none focus:border-accent bg-white resize-none"
                />
                <div className="flex justify-between items-center mt-1 ml-0.5">
                  <span className="text-[9px] text-ink3 font-medium">Recommended: 120-160 chars</span>
                  <span className="text-[9px] font-bold text-ink2">{form.meta_description?.length || 0}/160</span>
                </div>
              </div>

            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Publish Settings */}
            <div className="bg-white border border-black/[0.06] rounded-3xl p-5">
              <h3 className="font-syne font-black text-sm uppercase tracking-widest text-ink mb-4">Publish Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-ink2 mb-2">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/[0.1] text-sm bg-white focus:outline-none focus:border-accent"
                  >
                    <option value="draft">Draft (Hidden)</option>
                    <option value="published">Published (Live)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-ink2 mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/[0.1] text-sm bg-white focus:outline-none focus:border-accent"
                  >
                    {["General", "Industry News", "Packaging Tips", "Market Trends", "Company Updates", "Product Guides"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-ink2 mb-2">Author</label>
                  <input
                    value={form.author}
                    onChange={(e) => set("author", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-black/[0.1] text-sm bg-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-ink2 mb-2">Tags</label>
                  <input
                    value={form.tags}
                    onChange={(e) => set("tags", e.target.value)}
                    placeholder="BOPP, PET, Packaging..."
                    className="w-full px-4 py-2.5 rounded-xl border border-black/[0.1] text-sm bg-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="bg-white border border-black/[0.06] rounded-3xl p-5">
              <h3 className="font-syne font-black text-sm uppercase tracking-widest text-ink mb-3">Cover Image</h3>

              {/* Mode toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black border transition-all ${
                    imageMode === "url" ? "bg-accent text-white border-accent" : "bg-surface border-black/[0.08] text-ink2"
                  }`}
                >
                  <LinkIcon size={12} /> URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black border transition-all ${
                    imageMode === "upload" ? "bg-accent text-white border-accent" : "bg-surface border-black/[0.08] text-ink2"
                  }`}
                >
                  <Upload size={12} /> Upload
                </button>
              </div>

              {imageMode === "url" ? (
                <div>
                  <input
                    value={form.image_url}
                    onChange={(e) => set("image_url", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2.5 rounded-xl border border-black/[0.1] text-sm bg-white focus:outline-none focus:border-accent"
                  />
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt="preview"
                      className="mt-3 w-full h-32 object-cover rounded-xl"
                      onError={(e) => e.target.style.display = "none"}
                    />
                  )}
                </div>
              ) : (
                <div>
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-black/[0.1] rounded-xl p-6 text-center hover:border-accent/40 transition-colors">
                      {uploadPreview ? (
                        <img src={uploadPreview} alt="preview" className="w-full h-32 object-cover rounded-lg" />
                      ) : (
                        <>
                          <Image size={28} className="mx-auto text-ink3 mb-2" />
                          <p className="text-xs text-ink3">Click to upload image</p>
                          <p className="text-[10px] text-ink3 mt-0.5">JPG, PNG, WEBP up to 10MB</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  {uploadPreview && (
                    <button
                      type="button"
                      onClick={() => { setUploadFile(null); setUploadPreview(null); }}
                      className="text-xs text-red-500 mt-2 hover:underline"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white py-3.5 rounded-2xl font-black text-sm hover:bg-orange-600 transition-colors shadow-lg shadow-accent/20 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Saving..." : (isEdit ? "Update Blog Post" : "Publish Blog Post")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
