import { useState } from "react";
import { useNavigate } from "react-router-dom";
// ✅ FIX: Import path badal kar auth.js kiya gaya hai
import { signIn, signUp } from "../services/authServices.js"; 
import { useNotification } from "../context/NotificationContext";
import { motion } from "framer-motion";

// ─── SMALL ICON COMPONENTS ──────────────────────────────────────────────────
const MailIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg> );
const LockIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> );
const UserIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> );
const EyeIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg> );
const EyeOffIcon = () => ( <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg> );
const SpinIcon = () => ( <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" /><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" /></svg> );

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────
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

function Alert({ message, type }) {
  if (!message) return null;

  const styles = {
    success: "bg-green-50 text-green-700 border border-green-200",
    error: "bg-red-50 text-red-600 border border-red-200",
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
  };

  const icons = {
    success: "✅",
    error: "❌",
    pending: "⏳",
  };

  return (
    <div className={`text-xs px-4 py-3 rounded-xl font-medium flex items-start gap-2 ${styles[type] || styles.error}`}>
      <span className="mt-0.5 shrink-0">{icons[type] || icons.error}</span>
      <span>{message}</span>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { notifySuccess, notifyError, notifyWarning } = useNotification();

  const switchMode = (m) => {
    setMode(m);
    setEmail(""); setPassword(""); setRegName(""); setRegEmail(""); setRegPassword("");
  };

  // ── SIGN IN (LOGIN) ──
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return notifyError("Please fill in all fields.");
    
    setLoading(true);
    try {
      const data = await signIn({ email, password }); 

      // Sirf Token store karo (role aur userName token me hi decoded hain)
      localStorage.setItem("token", data.token);

      notifySuccess(`Welcome! Redirecting as ${data.role}...`);

      // Role Based Redirection
      setTimeout(() => {
        if (data.role === "admin") window.location.href = "/admin/dashboard";
        else if (data.role === "seller") window.location.href = "/seller/dashboard";
        else window.location.href = "/";
      }, 1000);
    } catch (err) {
      // Backend error message extract karo
      const backendMsg = err?.response?.data?.message || err.message || "Invalid credentials.";

      // Pending verification seller ke liye special amber message
      const isPending =
        backendMsg.toLowerCase().includes("pending") ||
        backendMsg.toLowerCase().includes("verify") ||
        backendMsg.toLowerCase().includes("approval");

      if (isPending) {
        notifyWarning("Your account has not been verified yet. You can log in after admin approval. Please wait for 24 hours.");
      } else {
        notifyError(backendMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── SIGN UP (REGISTER) ──
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regMobile || !regPassword) return notifyError("Please fill in all fields.");
    if (regMobile.length !== 10) return notifyError("Mobile number must be 10 digits.");
    
    setLoading(true);
    try {
      await signUp({ name: regName, email: regEmail, mobile: regMobile, password: regPassword });
      notifySuccess("Account created! Please sign in.");
      setTimeout(() => switchMode("login"), 1500);
    } catch (err) {
      notifyError(err.message || err || "Registration failed.");
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
                  {mode === "login" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#e8511a" strokeWidth={2} className="w-7 h-7"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#e8511a" strokeWidth={2} className="w-7 h-7"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight font-syne uppercase">{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
                <p className="text-gray-500 text-sm mt-1">{mode === "login" ? "Sign in to PackagingBazaar" : "Join 500+ businesses"}</p>
              </div>

              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <InputField label="Email or Mobile Number" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email or 10-digit mobile number" icon={<MailIcon />} />
                  <div>
                    <InputField label="Password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" icon={<LockIcon />} rightElement={<button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400 hover:text-[#e8511a]">{showPw ? <EyeOffIcon /> : <EyeIcon />}</button>} />
                    <div className="flex justify-end mt-1.5">
                      <button type="button" onClick={() => navigate("/forgot-password")} className="text-xs text-[#e8511a] font-medium hover:underline">Forgot password?</button>
                    </div>
                  </div>
                  <div className="bg-[#fff7f3] border border-[#fdd5c0] rounded-xl px-3 py-2.5 flex items-start gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#e8511a" strokeWidth={2} className="w-4 h-4 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <p className="text-[10px] leading-tight text-[#c44010] font-medium uppercase">Your role is verified automatically based on your account credentials.</p>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-[#e8511a] hover:bg-[#d4460f] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-orange-200 active:scale-[0.98]">
                    {loading ? <><SpinIcon /> Processing...</> : "Sign In →"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <InputField label="Full Name" type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="e.g. Rahul Sharma" icon={<UserIcon />} />
                  <InputField label="Email Address" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="e.g. rahul@example.com" icon={<MailIcon />} />
                  <InputField 
                    label="Mobile Number" 
                    type="tel" 
                    value={regMobile} 
                    onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} 
                    placeholder="10-digit mobile" 
                    icon={<span className="text-[10px] font-bold">+91</span>} 
                  />
                  <InputField label="Password" type={showRegPw ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Min. 6 characters" icon={<LockIcon />} rightElement={<button type="button" onClick={() => setShowRegPw(!showRegPw)} className="text-gray-400 hover:text-[#e8511a]">{showRegPw ? <EyeOffIcon /> : <EyeIcon />}</button>} />
                  <button type="submit" disabled={loading} className="w-full bg-[#e8511a] hover:bg-[#d4460f] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-orange-200 active:scale-[0.98]">
                    {loading ? <><SpinIcon /> Creating...</> : "Create Account →"}
                  </button>
                </form>
              )}

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400 uppercase font-bold tracking-widest">or</span><div className="flex-1 h-px bg-gray-200" />
              </div>

              <p className="text-center text-sm text-gray-500 font-medium">
                {mode === "login" ? "New to PackagingBazaar? " : "Already have an account? "}
                <button onClick={() => switchMode(mode === "login" ? "register" : "login")} className="text-[#e8511a] font-bold hover:underline bg-transparent transition-colors">{mode === "login" ? "Create Account" : "Sign In"}</button>
              </p>

              {/* Seller Registration Link */}
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">Want to sell on PackagingBazaar?</p>
                <button
                  onClick={() => navigate("/become-a-seller")}
                  className="mt-1.5 text-sm font-bold text-gray-700 hover:text-[#e8511a] transition-colors flex items-center gap-1 mx-auto"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                  Register as a Seller →
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}