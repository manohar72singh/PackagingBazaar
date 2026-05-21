import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resetPasswordAPI } from "../services/authServices";
import { useNotification } from "../context/NotificationContext";
import { motion } from "framer-motion";

// Icons
const LockIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> );
const EyeIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg> );
const EyeOffIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg> );
const SpinIcon = () => ( <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" /><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" /></svg> );

function InputField({ label, type, value, onChange, placeholder, icon, rightElement }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#e8511a] focus:bg-white focus:ring-2 focus:ring-[#e8511a]/10 transition-all" />
        {rightElement && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</span>}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { notifyError, notifySuccess } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return notifyError("Please fill in both password fields.");
    if (password !== confirmPassword) return notifyError("Passwords do not match.");
    if (password.length < 6) return notifyError("Password must be at least 6 characters.");
    
    setLoading(true);
    try {
      await resetPasswordAPI(token, password);
      notifySuccess("Password reset successfully!");
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Failed to reset password. Link may be expired.");
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
                <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight font-syne uppercase">Set New Password</h1>
                <p className="text-gray-500 text-sm mt-1">Please enter your new password below.</p>
              </div>

              {success ? (
                <div className="text-center space-y-5">
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 text-sm font-medium flex items-center justify-center gap-2">
                    <span>✅</span> Password reset successfully!
                  </div>
                  <p className="text-sm text-gray-500">Redirecting to login page...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <InputField 
                    label="New Password" 
                    type={showPw ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Min. 6 characters" 
                    icon={<LockIcon />} 
                    rightElement={<button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400 hover:text-[#e8511a]">{showPw ? <EyeOffIcon /> : <EyeIcon />}</button>} 
                  />
                  <InputField 
                    label="Confirm New Password" 
                    type={showConfirmPw ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Re-enter password" 
                    icon={<LockIcon />} 
                    rightElement={<button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="text-gray-400 hover:text-[#e8511a]">{showConfirmPw ? <EyeOffIcon /> : <EyeIcon />}</button>} 
                  />
                  <button type="submit" disabled={loading} className="w-full bg-[#e8511a] hover:bg-[#d4460f] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-orange-200 active:scale-[0.98] mt-2">
                    {loading ? <><SpinIcon /> Saving...</> : "Reset Password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
