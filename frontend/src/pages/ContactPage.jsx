import { Mail, Phone, MapPin, Send } from "lucide-react";
import WhyChooseUs from "../components/sections/WhyChooseUs";
import { useNotification } from "../context/NotificationContext";
import { useState } from "react";
import { submitContactMessage } from "../services/contactServices";
import SEO from "../components/SEO";

export default function ContactPage() {
  const { notifySuccess, notifyError } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  // ... rest of state
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    subject: "",
    otherSubject: "",
    message: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      return notifyError("Please fill in all required fields.");
    }

    const finalSubject = formData.subject === "Other" ? formData.otherSubject : formData.subject;

    setSubmitting(true);
    try {
      await submitContactMessage({ ...formData, subject: finalSubject });
      notifySuccess("Message sent! We will contact you soon.");
      setFormData({
        name: "",
        company_name: "",
        email: "",
        phone: "",
        subject: "",
        otherSubject: "",
        message: ""
      });
    } catch (error) {
      notifyError(error.message || "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <SEO title="Contact Us" description="Get in touch with PackagingBazaar for custom quotes and inquiries about premium packaging films." />
      <div className="bg-ink py-10 md:py-14 px-4 text-center md:text-left">
        <div className="max-w-7xl mx-auto">
          <span className="text-[10px] md:text-xs font-semibold tracking-[3px] uppercase text-accent">
            Get In Touch
          </span>
          <h1 className="font-syne font-black text-3xl md:text-4xl text-white mt-2 uppercase">
            Contact Us
          </h1>
        </div>
      </div>
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-syne font-black text-2xl text-ink mb-4">
              Send us a message
            </h2>
            <p className="text-ink3 text-sm mb-6 leading-relaxed">
              Fill out the form and our team will get back to you within 2 hours
              with a custom quote.
            </p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  className="border border-black/10 rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-accent w-full"
                />
                <input
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Company Name"
                  className="border border-black/10 rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-accent w-full"
                />
              </div>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                type="email"
                className="border border-black/10 rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-accent w-full"
              />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={10}
                placeholder="Phone Number"
                className="border border-black/10 rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-accent w-full"
              />
              <select 
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="border border-black/10 rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-accent w-full text-ink2"
              >
                <option value="">Select Product Type</option>
                <option value="BOPP Films">BOPP Films</option>
                <option value="PET Films">PET Films</option>
                <option value="CPP Films">CPP Films</option>
                <option value="Become a Seller">Become a Seller</option>
                <option value="Other">Other</option>
              </select>

              {formData.subject === "Other" && (
                <input
                  name="otherSubject"
                  value={formData.otherSubject}
                  onChange={handleChange}
                  placeholder="Please specify subject"
                  className="border border-black/10 rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-accent w-full animate-fadeIn"
                />
              )}
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your message or requirements..."
                rows={4}
                className="border border-black/10 rounded-xl px-4 py-3 text-sm bg-surface focus:outline-none focus:border-accent w-full resize-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-accent text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                <Send size={15} /> {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
          <div className="space-y-5">
            <h2 className="font-syne font-black text-2xl text-ink">
              Contact Info
            </h2>
            {[
              [Mail, "Email", "Admin@packagingbazaar.co.in"],
              [Phone, "Phone", "+91 96674 35374"],
              [MapPin, "Address", "Noida, Uttar Pradesh"],
            ].map(([Icon, label, l1, l2]) => (
              <div
                key={label}
                className="flex gap-4 bg-white rounded-2xl border border-black/[0.07] p-5"
              >
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-ink mb-1">
                    {label}
                  </div>
                  <div className="text-sm text-ink3">{l1}</div>
                  <div className="text-sm text-ink3">{l2}</div>
                </div>
              </div>
            ))}
            <div className="bg-accent/10 border border-accent/20 rounded-2xl p-5">
              <h3 className="font-syne font-bold text-ink mb-2">
                Become a Seller
              </h3>
              <p className="text-sm text-ink2 leading-relaxed">
                Want to list your packaging films on PackagingBazaar? Fill the
                form above and select "Become a Seller". Our team will contact
                you within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>
      <WhyChooseUs />
    </>
  );
}
