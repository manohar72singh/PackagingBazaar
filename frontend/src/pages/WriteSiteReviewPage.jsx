import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { verifyReviewToken, submitSiteReview } from "../services/reviewServices";
import { Star, MessageSquare, Building2, User, Award, AlertCircle, CheckCircle2 } from "lucide-react";

export default function WriteSiteReviewPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Status States: 'loading', 'invalid', 'form', 'submitted'
  const [pageState, setPageState] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [rating, setRating] = useState(5);
  const [reviewerName, setReviewerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    validateLink();
  }, [token]);

  const validateLink = async () => {
    if (!token) {
      setPageState("invalid");
      setErrorMessage("Review token is missing from the URL. Please use the complete link sent to you.");
      return;
    }

    try {
      const res = await verifyReviewToken(token);
      if (res.success && res.valid) {
        setPageState("form");
      } else {
        setPageState("invalid");
        setErrorMessage(res.message || "This review link is invalid or has already been used.");
      }
    } catch (err) {
      setPageState("invalid");
      setErrorMessage(err.response?.data?.message || "This review link has expired or is invalid. Each invitation link can only be used once.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      return alert("Please enter your name");
    }
    if (!comment.trim()) {
      return alert("Please share your feedback comment");
    }

    setSubmitting(true);
    try {
      const res = await submitSiteReview({
        token,
        reviewer_name: reviewerName,
        company_name: companyName,
        designation,
        rating,
        comment
      });

      if (res.success) {
        setPageState("submitted");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ──── RENDER: LOADING STATE ────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Verifying invitation link...</p>
      </div>
    );
  }

  // ──── RENDER: INVALID / EXPIRED STATE ────
  if (pageState === "invalid") {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/40 via-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-red-100/50 shadow-2xl p-8 md:p-12 max-w-md w-full text-center animate-[fadeIn_0.4s_ease-out]">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100">
            <AlertCircle size={28} />
          </div>
          <h2 className="font-syne font-black text-2xl text-slate-900 uppercase mb-3">Link Expired or Invalid</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6 font-medium">
            {errorMessage}
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
            🛡️ Authentic Review System: <br/>To ensure 100% verified experiences, each invitation link is valid only for a single submission.
          </div>
        </div>
      </div>
    );
  }

  // ──── RENDER: THANK YOU / SUCCESS STATE ────
  if (pageState === "submitted") {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-50 via-slate-50 to-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] border border-green-100/40 shadow-2xl p-8 md:p-12 max-w-lg w-full text-center animate-[fadeIn_0.5s_ease-out]">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-100/50 animate-bounce">
            <CheckCircle2 size={36} />
          </div>
          <span className="text-[10px] font-black text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
            Feedback Registered
          </span>
          <h2 className="font-syne font-black text-4xl text-slate-900 uppercase tracking-tight mb-4">Thank You!</h2>
          <p className="text-base text-slate-600 leading-relaxed font-semibold max-w-sm mx-auto">
            Your valuable platform review has been successfully submitted. We deeply appreciate your support and feedback!
          </p>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              PackagingBazaar - Global Verified Network
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ──── RENDER: FORM STATE ────
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/20 via-slate-50 to-slate-100 py-12 px-4 flex items-center justify-center">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 md:p-10 max-w-xl w-full animate-[fadeIn_0.4s_ease-out]">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-accent/5 px-3 py-1 rounded-full border border-accent/10 mb-3">
            <Award size={12} className="text-accent" />
            <span className="text-[9px] font-black text-accent uppercase tracking-widest">Platform Feedback</span>
          </div>
          <h1 className="font-syne font-black text-3xl text-slate-900 uppercase tracking-tight">Share Your Experience</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Help us make PackagingBazaar even better</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Dynamic Interactive Star Selector */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
              Your Platform Rating
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-125 transition-transform duration-200"
                >
                  <Star
                    size={32}
                    className={`transition-colors duration-200 ${
                      star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-none"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider mt-2.5">
              {rating === 5 ? "⭐️ Excellent" : rating === 4 ? "✨ Very Good" : rating === 3 ? "👍 Good" : rating === 2 ? "⚠️ Fair" : "👎 Poor"}
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Reviewer Name */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User size={16} className="absolute left-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full text-sm font-semibold text-slate-800 bg-slate-50/50 pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-accent focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Grid for Company & Designation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">
                  Company Name
                </label>
                <div className="relative flex items-center">
                  <Building2 size={16} className="absolute left-4 text-slate-400" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full text-sm font-semibold text-slate-800 bg-slate-50/50 pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-accent focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">
                  Your Designation
                </label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-4 text-slate-400" />
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Procurement Manager"
                    className="w-full text-sm font-semibold text-slate-800 bg-slate-50/50 pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-accent focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Comment Field */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">
                Share Your Feedback <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MessageSquare size={16} className="absolute left-4 top-4 text-slate-400" />
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How has your experience been with PackagingBazaar, the response times, quality of sellers, and standard of support?..."
                  className="w-full text-sm font-medium text-slate-800 bg-slate-50/50 pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 outline-none focus:border-accent focus:bg-white transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-accent hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Submitting Review..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
