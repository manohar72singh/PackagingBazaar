import API from "./api";

// 1. User Sign Up
export const signUp = async (userData) => {
  const response = await API.post("/auth/signup", userData);
  return response.data;
};

// 2. User Sign In
export const signIn = async (credentials) => {
  const response = await API.post("/auth/signin", credentials);
  return response.data;
};

// 3. Register Seller (Legacy - single step)
export const registerSellerAPI = async (formData) => {
  const response = await API.post("/auth/register-seller", formData);
  return response.data;
};



// 6. Get Current User Data (Token se user info nikalne ke liye)
export const fetchUserData = async () => {
  const response = await API.get("/auth/me");
  return response.data;
};

// 7. Forgot Password
export const forgotPasswordAPI = async (email) => {
  const response = await API.post("/auth/forgot-password", { email });
  return response.data;
};

// 8. Reset Password
export const resetPasswordAPI = async (token, newPassword) => {
  const response = await API.post("/auth/reset-password", { token, newPassword });
  return response.data;
};