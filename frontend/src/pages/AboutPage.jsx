import WhyChooseUs from "../components/sections/WhyChooseUs";
import ReviewSection from "../components/sections/ReviewSection";
import SEO from "../components/SEO";

export default function AboutPage() {
  return (
    <>
      <SEO title="About Us" description="PackagingBazaar is India's most reliable packaging film marketplace. We connect verified buyers and sellers." />
      <div className="bg-ink py-8 md:py-14 px-4 text-center md:text-left">
        <div className="max-w-7xl mx-auto">
          <span className="text-[10px] md:text-xs font-semibold tracking-[3px] uppercase text-accent">
            Our Story
          </span>
          <h1 className="font-syne font-black text-2xl sm:text-3xl md:text-4xl text-white mt-2 uppercase">
            About PackagingBazaar
          </h1>
        </div>
      </div>
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-10 mb-14">
            <div>
              <h2 className="font-syne font-black text-xl sm:text-2xl md:text-3xl text-ink mb-4 uppercase leading-tight">
                INDIA’S MOST RELIABLE PACKAGING FILM MARKETPLACE
              </h2>
              <p className="text-sm text-ink2 leading-relaxed mb-4">
                PackagingBazaar helps you source and sell premium BOPP, PET, and CPP films with complete transparency, competitive pricing, and dependable quality—all in one place.
              </p>
              <p className="text-sm text-ink2 leading-relaxed">
                We don’t just generate leads—we help you close real deals. By connecting verified buyers and sellers with clear requirements, accurate pricing, and active support, we ensure faster conversions and meaningful business outcomes.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["100+", "Happy Clients"],
                ["50+", "Product Variants"],
                ["12+", "Years Experience"],
                ["24 hrs", "dispatch*"],
              ].map(([n, l]) => (
                <div
                  key={l}
                  className="bg-surface rounded-2xl p-5 border border-black/[0.07]"
                >
                  <div className="font-syne font-black text-3xl text-accent">
                    {n}
                  </div>
                  <div className="text-sm text-ink3 mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-ink rounded-3xl p-6 md:p-8 text-white mb-14">
            <h3 className="font-syne font-black text-2xl mb-3">Our Mission</h3>
            <p className="text-white/60 leading-relaxed">
              To make flexible packaging film sourcing more efficient, transparent, and outcome-driven—so businesses spend less time chasing leads and more time closing deals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              [
                "For Buyers",
                "Get access to verified suppliers offering premium films at competitive prices. Skip the back-and-forth and move straight to qualified deals with confidence.",
                "#e8f5e9",
                "#2e7d32",
              ],
              [
                "For Sellers",
                "Stop wasting time on low-quality inquiries. Connect with ready-to-buy customers, showcase your products, and close deals faster with real demand.",
                "#e3f2fd",
                "#1565c0",
              ],
              [
                "Quality You Can Trust",
                "Every product listed on PackagingBazaar follows strict ISI/ISO quality standards. Our supplier checks ensure consistency, reliability, and performance—every time you order.",
                "#fff3e0",
                "#e65100",
              ],
            ].map(([t, d, bg, color]) => (
              <div
                key={t}
                className="rounded-2xl p-6 border border-black/[0.07]"
                style={{ background: bg }}
              >
                <h4
                  className="font-syne font-bold text-base mb-2"
                  style={{ color }}
                >
                  {t}
                </h4>
                <p className="text-sm text-ink2 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <WhyChooseUs />
      <ReviewSection />
    </>
  );
}
