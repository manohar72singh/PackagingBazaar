import API, { API_BASE_URL } from "./api";

// --- Dashboard Summary ---
export const fetchDashboardStats = async () => {
  const response = await API.get("/admin/stats");
  return response.data;
};

export const fetchAnalyticsStats = async () => {
  const response = await API.get("/admin/analytics");
  return response.data;
};

// --- User Management ---
export const fetchAllUsers = async (page = 1, limit = 10, role = '') => {
  let url = `/admin/users?page=${page}&limit=${limit}`;
  if (role) url += `&role=${role}`;
  const response = await API.get(url);
  return response.data;
};

export const updateUserAccount = async (id, userData) => {
  const response = await API.put(`/admin/users/${id}`, userData);
  return response.data;
};

export const deleteUserAccount = async (id) => {
  const response = await API.delete(`/admin/users/${id}`);
  return response.data;
};

// --- Seller Management ---
export const fetchAllSellers = async (page = 1, limit = 10) => {
  const response = await API.get(`/admin/sellers/all?page=${page}&limit=${limit}`);
  return response.data;
};

export const fetchPendingSellers = async (page = 1, limit = 10) => {
  const response = await API.get(`/admin/sellers/pending?page=${page}&limit=${limit}`);
  return response.data;
};

export const updateSellerStatus = async (id, status) => {
  const response = await API.put(`/admin/sellers/${id}/status`, { status });
  return response.data;
};

export const rejectSellerAccount = async (id) => {
  const response = await API.delete(`/admin/sellers/${id}/reject`);
  return response.data;
};

// --- Product Management ---
export const fetchAllProductsAdmin = async (page = 1, limit = 10) => {
  const response = await API.get(`/admin/products/all?page=${page}&limit=${limit}`);
  return response.data;
};

export const deleteProductAdmin = async (id) => {
  const response = await API.delete(`/admin/products/${id}`);
  return response.data;
};

export const toggleHotDealAdmin = async (id, isHotDeal) => {
  const response = await API.patch(`/admin/products/${id}/hot-deal`, { is_hot_deal: isHotDeal });
  return response.data;
};

export const toggleTrendingAdmin = async (id, isTrending) => {
  const response = await API.patch(`/admin/products/${id}/trending`, { is_trending: isTrending });
  return response.data;
};

// --- Sales Management ---
export const fetchAllOrdersAdmin = async (page = 1, limit = 10) => {
  const response = await API.get(`/admin/orders?page=${page}&limit=${limit}`);
  return response.data;
};

export const fetchUserOrdersAdmin = async (userId) => {
  const response = await API.get(`/admin/orders/user/${userId}`);
  return response.data;
};

export const fetchSellerOrdersAdmin = async (sellerId, page = 1, limit = 10) => {
  const response = await API.get(`/admin/orders/seller/${sellerId}?page=${page}&limit=${limit}`);
  return response.data;
};

export const fetchSellerProductsAdmin = async (sellerId, page = 1, limit = 10) => {
  const response = await API.get(`/admin/products/seller/${sellerId}?page=${page}&limit=${limit}`);
  return response.data;
};

export const fetchSellersWithOrdersAdmin = async (page = 1, limit = 10) => {
  const response = await API.get(`/admin/sellers/with-orders?page=${page}&limit=${limit}`);
  return response.data;
};

// --- Lead Management (Inquiries) ---
export const fetchInquiriesAdmin = async (page = 1, limit = 10) => {
  const response = await API.get(`/admin/inquiries?page=${page}&limit=${limit}`);
  return response.data;
};

export const updateInquiryAdmin = async (id, data) => {
  const response = await API.patch(`/admin/inquiries/${id}`, data);
  return response.data;
};

export const fetchLeadRecommendations = async (id) => {
  const response = await API.get(`/admin/inquiries/${id}/recommendations`);
  return response.data;
};

export const fetchInquiryAssignedSellers = async (id) => {
  const response = await API.get(`/admin/inquiries/${id}/assigned-sellers`);
  return response.data;
};

export const shareLeadWithSellerAdmin = async (id, sellerId = null, assignmentNote = "") => {
  const response = await API.patch(`/admin/inquiries/${id}/share`, { seller_id: sellerId, assignment_note: assignmentNote });
  return response.data;
};

export const bulkUploadProducts = async (sellerUserId, csvFile, images) => {
  const formData = new FormData();
  formData.append('csvFile', csvFile);
  images.forEach(img => {
    formData.append('images', img);
  });

  const response = await API.post(`/admin/products/bulk-upload/${sellerUserId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const addProductForSeller = async (sellerUserId, productData) => {
  const response = await API.post(`/admin/products/seller/${sellerUserId}`, productData);
  return response.data;
};

export const updateProductAdmin = async (id, productData) => {
  const response = await API.put(`/products/update/${id}`, productData);
  return response.data;
};

export const fetchProductById = async (id) => {
  const response = await API.get(`/products/${id}`);
  return response.data;
};

export const addSellerAdmin = async (sellerData) => {
  const formData = new FormData();
  Object.keys(sellerData).forEach(key => {
    if (key === 'gstCertificate' && sellerData[key]) {
      formData.append('gst_certificate', sellerData[key]);
    } else if (sellerData[key] !== undefined && sellerData[key] !== null) {
      formData.append(key, sellerData[key]);
    }
  });

  const response = await API.post("/admin/sellers/add", formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateSellerAdmin = async (id, sellerData) => {
  const formData = new FormData();
  Object.keys(sellerData).forEach(key => {
    if (key === 'gstCertificate' && sellerData[key] instanceof File) {
      formData.append('gst_certificate', sellerData[key]);
    } else if (sellerData[key] !== undefined && sellerData[key] !== null) {
      formData.append(key, sellerData[key]);
    }
  });

  const response = await API.put(`/admin/sellers/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const uploadProductImage = async (file) => {
  const formData = new FormData();
  formData.append('product_image', file);
  const response = await API.post(`/admin/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// --- Master Data ---
export const fetchCategories = async () => {
  const response = await API.get("/categories");
  return response.data;
};

export const fetchSubCategories = async (categoryId = "") => {
  const response = await API.get(`/sub-categories${categoryId ? `?categoryId=${categoryId}` : ""}`);
  return response.data;
};

export const fetchTags = async () => {
  const response = await API.get("/tags");
  return response.data;
};

export const fetchApplications = async () => {
  const response = await API.get("/applications");
  return response.data;
};

// --- Product Groups ---
export const fetchProductGroups = async (categoryId = "") => {
  const response = await API.get(`/product-groups?categoryId=${categoryId}`);
  return response.data;
};

export const createProductGroup = async (groupData) => {
  const response = await API.post("/product-groups", groupData);
  return response.data;
};

// --- Category & SubCategory Management ---
export const createCategoryAdmin = async (name) => {
  const response = await API.post("/admin/categories", { name });
  return response.data;
};

export const deleteCategoryAdmin = async (id) => {
  const response = await API.delete(`/admin/categories/${id}`);
  return response.data;
};

export const createSubCategoryAdmin = async (name, categoryId) => {
  const response = await API.post("/admin/subcategories", { name, category_id: categoryId });
  return response.data;
};

export const deleteSubCategoryAdmin = async (id) => {
  const response = await API.delete(`/admin/subcategories/${id}`);
  return response.data;
};

// --- Export Data ---
export const getExportUrl = (entity) => {
  const token = localStorage.getItem("token");
  return `${API_BASE_URL}/api/admin/export/${entity}?token=${token}`;
};

export const downloadExport = async (entity) => {
  const response = await API.get(`/admin/export/${entity}`, {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `export_${entity}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
