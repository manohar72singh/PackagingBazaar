import { Link } from "react-router-dom";
import { Package, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ink text-white/60">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Package size={16} className="text-white" />
              </div>
              <span className="font-syne font-black text-xl text-white uppercase tracking-tighter">
                Packaging<span className="text-accent">Bazaar</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-xs sm:max-w-none">
              India's trusted marketplace for BOPP, PET & CPP laminate films.
              Buy direct or sell on our platform.
            </p>
            <div className="flex flex-col items-center sm:items-start gap-3 text-[13px]">
              <span className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail size={14} className="text-accent" /> Admin@packagingbazaar.co.in
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone size={14} className="text-accent" /> +91 96674 35374
              </span>
              <span className="flex items-center gap-2 hover:text-white transition-colors">
                <MapPin size={14} className="text-accent" /> Noida, Uttar Pradesh
              </span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <h4 className="font-syne font-bold text-sm text-white mb-4 sm:mb-6 uppercase tracking-widest text-[11px]">
              Products
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                "BOPP Films",
                "PET Films",
                "CPP Films",
                "Laminates",
                "Specialty Films",
              ].map((i) => (
                <li key={i}>
                  <Link
                    to="/products"
                    className="hover:text-accent transition-colors block py-0.5"
                  >
                    {i}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 sm:mt-0">
            <h4 className="font-syne font-bold text-sm text-white mb-4 sm:mb-6 uppercase tracking-widest text-[11px]">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                ["About Us", "/about"],
                ["Contact Us", "/contact"],
                ["Become a Seller", "/become-a-seller"],
                ["Blog", "#"],
              ].map(([l, h]) => (
                <li key={l}>
                  <Link to={h} className="hover:text-accent transition-colors block py-0.5">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 sm:mt-0">
            <h4 className="font-syne font-bold text-sm text-white mb-4 sm:mb-6 uppercase tracking-widest text-[11px]">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                ["Privacy Policy", "/policy#privacy-policy"],
                ["Return Policy", "/policy#return-policy"],
                ["Terms of Use", "/policy#terms-of-use"],
                ["Shipping Policy", "/policy#shipping-policy"],
              ].map(([l, h]) => (
                <li key={l}>
                  <Link to={h} className="hover:text-accent transition-colors block py-0.5">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/[0.08] pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs">
          <span>© 2025 PackagingBazaar. All rights reserved.</span>
          {/* <span>Made with ♥ in India</span> */}
        </div>
      </div>
    </footer>
  );
}
