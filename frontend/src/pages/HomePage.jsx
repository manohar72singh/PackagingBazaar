import HeroSection        from "../components/sections/HeroSection";
import FeaturedProducts   from "../components/sections/FeaturedProducts";
import TrendingProducts   from "../components/sections/TrendingProducts";
import TopSelling         from "../components/sections/TopSelling";
import WhyChooseUs        from "../components/sections/WhyChooseUs";
import ReviewSection      from "../components/sections/ReviewSection";
import SEO from "../components/SEO";
import { Helmet } from "react-helmet-async";

export default function HomePage() {
  return (
    <>
      <SEO title="Home" />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Packaging Bazaar",
            "url": window.location.origin,
            "logo": `${window.location.origin}/logo.png`,
            "description": "Premium wholesale and custom packaging solutions marketplace.",
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+91-0000000000",
              "contactType": "customer service"
            }
          })}
        </script>
      </Helmet>
      <HeroSection/>
      <FeaturedProducts/>
      <TopSelling/>
      <TrendingProducts/>
      <WhyChooseUs/>
      <ReviewSection/>
    </>
  );
}
