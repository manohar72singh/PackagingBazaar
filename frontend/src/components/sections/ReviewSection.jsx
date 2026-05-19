import { useState, useEffect, useRef } from "react";
import { fetchAllReviews, fetchSiteReviews } from "../../services/reviewServices";
import { Star, User, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  // Premium Auto-Scroll Carousel Engine
  useEffect(() => {
    if (reviews.length <= 1 || !scrollRef.current) return;

    const interval = setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScrollLeft = scrollWidth - clientWidth;

      // If reached the end, loop back smoothly
      if (scrollLeft >= maxScrollLeft - 10) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        // Card width (350px) + Gap (24px) = 374px
        const stepWidth = window.innerWidth < 640 ? 314 : 374;
        container.scrollTo({ left: scrollLeft + stepWidth, behavior: "smooth" });
      }
    }, 3500); // Transitions comfortably every 3.5 seconds

    return () => clearInterval(interval);
  }, [reviews]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      let data;
      if (productId) {
        data = await fetchAllReviews({ product_id: productId, status: 'approved' });
      } else {
        data = await fetchSiteReviews();
      }
      setReviews(data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + Number(curr.rating), 0) / reviews.length).toFixed(1)
    : 0;

  if (loading) return (
    <div className="py-10 text-center text-gray-400 font-black uppercase tracking-widest text-[10px] animate-pulse">
      Fetching Feedback...
    </div>
  );

  return (
    <section className="py-16 px-4 bg-surface/30 border-t border-black/[0.02]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-accent/5 px-3 py-1 rounded-full border border-accent/10 mb-2">
               <Star size={10} className="fill-accent text-accent" />
               <span className="text-[10px] font-black text-accent uppercase tracking-wider">Client Stories</span>
            </div>
            <h2 className="font-syne font-black text-3xl text-ink uppercase tracking-tight">What Buyers Say</h2>
            <p className="text-xs text-ink3 font-medium">Real experiences from our global packaging network</p>
          </div>

          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-black/[0.04] shadow-sm shrink-0">
             <div className="flex flex-col items-center">
                <span className="text-xl font-syne font-black text-ink">{avgRating}</span>
                <div className="flex items-center gap-0.5">
                   {[...Array(5)].map((_, i) => (
                      <Star key={i} size={8} className={i < Math.round(avgRating) ? "fill-orange-400 text-orange-400" : "text-gray-200"} />
                   ))}
                </div>
             </div>
             <div className="text-right">
                <div className="text-sm font-black text-ink">{reviews.length}</div>
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reviews</div>
             </div>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/30">
             <Quote className="mx-auto text-gray-200 mb-4 opacity-50" size={40} />
             <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No verified feedback yet</p>
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reviews.map((review, idx) => (
              <motion.div 
                key={review.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="w-[290px] sm:w-[350px] bg-white p-6 rounded-[2rem] border border-black/[0.04] shadow-sm relative group hover:shadow-xl hover:shadow-black/5 transition-all snap-center shrink-0"
              >
                <Quote className="absolute top-6 right-6 text-gray-50 group-hover:text-accent/5 transition-colors" size={32} />
                
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shrink-0">
                      <User className="text-gray-400" size={18} />
                   </div>
                   <div>
                      <h4 className="font-black text-ink text-xs uppercase tracking-tight">{review.reviewer_name || review.user_name || "Anonymous Buyer"}</h4>
                      <div className="flex items-center gap-0.5 mt-0.5">
                         {[...Array(5)].map((_, i) => (
                            <Star key={i} size={8} className={i < review.rating ? "fill-orange-400 text-orange-400" : "text-gray-200"} />
                         ))}
                      </div>
                   </div>
                </div>

                <p className="text-gray-600 text-xs leading-relaxed italic line-clamp-3">
                  "{review.comment}"
                </p>

                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                   <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest max-w-[70%] truncate">
                      {productId ? "Verified Purchase" : (review.designation ? `${review.designation}${review.company_name ? ` - ${review.company_name}` : ""}` : (review.company_name || "Platform Partner"))}
                   </span>
                   <span className="text-[8px] font-bold text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                   </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

