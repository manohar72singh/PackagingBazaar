import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordAPI } from "../services/authServices";
import { useNotification } from "../context/NotificationContext";
import { motion } from "framer-motion";

// Icons
const MailIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg> );
const SpinIcon = () => ( <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" /><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" /></svg> );

function InputField({ label, type, value, onChange, placeholder, icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#e8511a] focus:bg-white focus:ring-2 focus:ring-[#e8511a]/10 transition-all" />
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const { notifyError } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return notifyError("Please enter your email address.");
    
    setLoading(true);
    try {
      await forgotPasswordAPI(email);
      setSuccessMsg(true);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] flex flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="h-1.5 bg-gradient-to-r from-[#e8511a] via-[#f07840] to-[#e8511a]" />
            <div className="p-8">
              <div className="mb-7 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-[#fff2ec] rounded-2xl mb-4">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#e8511a" strokeWidth={2} className="w-7 h-7"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight font-syne uppercase">Forgot Password</h1>
                <p className="text-gray-500 text-sm mt-1">Enter your email to receive a reset link.</p>
              </div>

              {successMsg ? (
                <div className="text-center space-y-5">
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 text-sm">
                    If an account exists with that email, we have sent a password reset link. Please check your inbox.
                  </div>
                  <button onClick={() => navigate("/login")} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all text-sm">
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <InputField label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. rahul@example.com" icon={<MailIcon />} />
                  <button type="submit" disabled={loading} className="w-full bg-[#e8511a] hover:bg-[#d4460f] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-orange-200 active:scale-[0.98]">
                    {loading ? <><SpinIcon /> Sending...</> : "Send Reset Link"}
                  </button>
                </form>
              )}
              
              {!successMsg && (
                <p className="text-center text-sm text-gray-500 font-medium mt-6">
                  Remember your password?{" "}
                  <button type="button" onClick={() => navigate("/login")} className="text-[#e8511a] font-bold hover:underline bg-transparent transition-colors">Sign In</button>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
