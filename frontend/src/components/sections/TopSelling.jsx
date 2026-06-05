import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchUniqueTopSelling } from "../../services/productServices"; 
import { TrendingUp, Loader2 } from "lucide-react";
import { getImageUrl } from "../../services/api";

const catColors = {
  BOPP: "bg-green-100 text-green-800",
  PET: "bg-blue-100 text-blue-800",
  CPP: "bg-orange-100 text-orange-800",
  LAMINATED: "bg-purple-100 text-purple-800",
};

export default function TopSelling() {
  const navigate = useNavigate();
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTopSellingData = async () => {
      try {
        const res = await fetchUniqueTopSelling();
        // ✅ Safe handling: agar res.data hai toh wo use karein, nahi toh direct res
        setTopItems(res.data || res || []); 
      } catch (err) {
        console.error("Top selling data load nahi hua:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTopSellingData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    );
  }

  return (
    <section className="py-12 sm:py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between mb-8 sm:mb-12 text-center sm:text-left">
          <div className="mb-4 sm:mb-0">
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[3px] uppercase text-accent">
              Most Popular
            </span>
            <h2 className="font-syne font-black text-2xl sm:text-3xl lg:text-4xl text-ink mt-1 uppercase">
              Top Selling Products
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-black uppercase tracking-widest text-accent hover:text-orange-700 transition-colors flex items-center gap-1.5"
          >
            Explore All Products <TrendingUp size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {topItems.length > 0 ? (
            topItems.map((p, i) => (
              <div
                key={p.id}
                onClick={() => navigate(`/products/${p.slug || p.id}`)}
                className="bg-surface rounded-2xl border border-black/[0.07] p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <span className="font-syne font-black text-3xl text-accent/20 min-w-[2rem]">
                  0{i + 1}
                </span>
                <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden bg-white border border-black/[0.05]">
                  <img
                    src={getImageUrl(p.image_url)}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-ink truncate">
                    {p.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        catColors[p.category_name] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.category_name || "General"}
                    </span>
                    <span className="text-[11px] text-ink3 flex items-center gap-0.5 font-medium">
                      <TrendingUp size={10} className="text-green-500" />
                      {p.review_count || 0} reviews
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-ink3 text-sm">No top selling products found.</p>
          )}
        </div>
      </div>
    </section>
  );
}