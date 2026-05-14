import API from "./api";

// 1. Fetch Seller Profile Logic
export const fetchSellerProfile = async () => {
  const response = await API.get("/seller/me");
  return response.data;
};

export const fetchSellerStats = async () => {
  const response = await API.get("/seller/stats");
  return response.data;
};

// 2. Fetch Seller Products
export const fetchSellerProducts = async (page = 1, limit = 10) => {
  const response = await API.get(`/seller/products?page=${page}&limit=${limit}`);
  return response.data;
};

// 3. Fetch Seller Orders
export const fetchSellerOrders = async (page = 1, limit = 10) => {
  const response = await API.get(`/seller/orders?page=${page}&limit=${limit}`);
  return response.data;
};

export const fetchSellerLeads = async () => {
  const response = await API.get("/seller/leads");
  return response.data;
};

export const updateLeadStatus = async (assignmentId, status, notes = "") => {
  const response = await API.patch(`/seller/leads/${assignmentId}/status`, { status, seller_notes: notes });
  return response.data;
};

export const createSellerProduct = async (productData) => {
  const response = await API.post("/seller/products", productData);
  return response.data;
};
export const updateSellerProduct = async (productId, productData) => {
  const response = await API.put(`/seller/products/${productId}`, productData);
  return response.data;
};
export const deleteSellerProductAPI = async (productId) => {
  const response = await API.delete(`/seller/products/${productId}`);
  return response.data;
};

export const updateSellerProfileAPI = async (profileData) => {
  const response = await API.put("/seller/profile", profileData);
  return response.data;
};