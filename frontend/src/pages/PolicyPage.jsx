import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function PolicyPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        const element = document.getElementById(hash.substring(1));
        if (element) {
          // Get the sticky header height (approx 80px) and add extra padding
          const offset = 100;
          const top = element.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: "smooth" });
        }
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hash]);

  const sections = [
    {
      id: "privacy-policy",
      title: "Privacy Policy",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      content: (
        <p className="leading-relaxed">
          PackagingBazaar collects only the information necessary to process your orders and improve our services. We do not sell or share your personal data with third parties without your consent. All data is stored securely on encrypted servers.
        </p>
      ),
    },
    {
      id: "return-policy",
      title: "Return & Refund Policy",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
        </svg>
      ),
      content: (
        <ul className="space-y-5">
          <li>
            <strong className="text-ink block mb-1 text-base">Eligibility for Returns</strong>
            Returns shall only be accepted if the product delivered is defective, damaged, or materially deviates from the agreed specifications at the time of order confirmation.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">Return Window</strong>
            Any request for return must be raised within seven (7) calendar days from the date of delivery.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">Conditions for Acceptance</strong>
            The product must remain unused, unaltered, and in its original condition and packaging. The Buyer must provide documentary evidence, including images, videos, and delivery records, substantiating the claim.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">Non-Returnable Items</strong>
            Custom-made, made-to-order, or customized products shall not be eligible for return or refund once production has commenced. Products approved by the Buyer prior to dispatch shall not be disputed on subjective grounds.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">Approval & Resolution</strong>
            All returns are subject to inspection and validation by the respective supplier. Refunds or replacements, if applicable, shall be processed at the sole discretion of the supplier.
          </li>
        </ul>
      ),
    },
    {
      id: "shipping-policy",
      title: "Shipping & Delivery Policy",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      content: (
        <ul className="space-y-5">
          <li>
            <strong className="text-ink block mb-1 text-base">Role of Packaging Bazaar</strong>
            Packaging Bazaar operates solely as a facilitator/marketplace and does not undertake shipping, logistics, or transportation responsibilities.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">Shipping Responsibility</strong>
            All shipping arrangements, including carrier selection, freight terms, delivery timelines, and associated costs, are mutually agreed upon between the Buyer and the Supplier at the time of order finalization. Packaging Bazaar may assist in coordination but shall bear no liability for delays, damages, or losses arising during transit.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">Dispatch & Delivery Timelines</strong>
            Dispatch timelines are determined exclusively by the Supplier. Delivery timelines are indicative and may vary based on location, order size, customization, and external factors.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">Risk & Title Transfer</strong>
            Unless otherwise agreed in writing, risk and title of goods pass to the Buyer upon dispatch from the Supplier’s facility.
          </li>
        </ul>
      ),
    },
    {
      id: "terms-of-use",
      title: "Terms of Use",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <ul className="space-y-5">
          <li>
            <strong className="text-ink block mb-1 text-base">1. Nature of Platform</strong>
            Packaging Bazaar acts as an intermediary platform connecting Buyers with independent Suppliers and is not the manufacturer, stockist, or owner of listed products.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">2. Commercial Use</strong>
            All products listed are intended strictly for commercial and industrial use. Buyers are responsible for ensuring suitability for their intended application.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">3. Pricing & Availability</strong>
            Prices, specifications, and availability are subject to change without prior notice, based on Supplier inputs. Final pricing is confirmed only upon order acceptance and confirmation by the Supplier.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">4. Minimum Order Quantities (MOQ)</strong>
            Orders are subject to minimum order quantities as specified by individual Suppliers.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">5. Limitation of Liability</strong>
            Packaging Bazaar shall not be liable for:
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-ink2">
              <li>Product defects, performance issues, or non-conformity</li>
              <li>Delays in dispatch or delivery</li>
              <li>Any indirect, incidental, or consequential damages arising from transactions between Buyer and Supplier</li>
            </ul>
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">6. Indemnity</strong>
            The Buyer agrees to indemnify and hold harmless Packaging Bazaar from any claims, damages, or disputes arising out of product usage, resale, or contractual disagreements with Suppliers.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">7. Governing Law & Jurisdiction</strong>
            These terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts located in GautamBuddh Nagar Uttar Pradesh.
          </li>
        </ul>
      ),
    },
    {
      id: "quality-assurance",
      title: "Quality Assurance",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      content: (
        <ul className="space-y-5">
          <li>
            <strong className="text-ink block mb-1 text-base">Supplier Responsibility</strong>
            Product quality, specifications, and compliance are the sole responsibility of the respective Supplier.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">Quality Checks & Documentation</strong>
            Suppliers may conduct pre-dispatch quality checks. Test certificates or reports may be provided for bulk orders upon prior agreement.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">Quality Disputes</strong>
            Any quality-related concerns must be reported promptly with supporting evidence. Packaging Bazaar will facilitate communication and resolution between Buyer and Supplier but does not guarantee outcomes.
          </li>
          <li>
            <strong className="text-ink block mb-1 text-base">Resolution Mechanism</strong>
            Any replacement, refund, or corrective action shall be subject to Supplier review, inspection, and approval, and governed by their individual policies.
          </li>
        </ul>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="bg-ink relative overflow-hidden py-24 px-4">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] bg-white/[0.02] rotate-12 blur-3xl rounded-full"></div>
          <div className="absolute top-[30%] -left-[10%] w-[40%] h-[100%] bg-accent/[0.04] -rotate-12 blur-3xl rounded-full"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="inline-block py-1 px-4 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-[3px] uppercase mb-6 border border-accent/20">
            Legal & Compliance
          </span>
          <h1 className="font-syne font-black text-5xl md:text-6xl text-white mb-6">
            Policies & Terms
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light">
            Everything you need to know about our terms, shipping, privacy, and how we handle your orders securely and transparently.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <section className="px-4 -mt-16 relative z-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((s, index) => (
            <div
              key={s.title}
              id={s.id}
              className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/[0.04] transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-colors duration-300 shrink-0">
                  {s.icon}
                </div>
                <div>
                  <h2 className="font-syne font-black text-2xl text-ink mb-5 mt-1">
                    {s.title}
                  </h2>
                  <div className="text-ink2 text-sm md:text-base">
                    {s.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="mt-20 px-4">
        <div className="max-w-3xl mx-auto text-center bg-white rounded-[2rem] p-10 md:p-14 shadow-sm border border-black/[0.04]">
          <h3 className="font-syne font-black text-3xl text-ink mb-4">
            Still have questions?
          </h3>
          <p className="text-ink2 mb-8 text-lg max-w-lg mx-auto">
            If you couldn't find the answer to your question in our policies, please feel free to reach out to our support team.
          </p>
          <a href="/contact" className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-ink bg-accent rounded-full hover:bg-opacity-90 transition-all duration-300 hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5">
            Contact Support
          </a>
        </div>
      </section>
    </div>
  );
}
