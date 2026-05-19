import API from "./api";

export const fetchAllReviews = async (params) => {
    const response = await API.get("/reviews", { params });
    return response.data;
};

export const addManualReview = async (reviewData) => {
    const response = await API.post("/reviews/add", reviewData);
    return response.data;
};

export const deleteReview = async (id) => {
    const response = await API.delete(`/reviews/${id}`);
    return response.data;
};

export const updateReviewStatus = async (id, status) => {
    const response = await API.put(`/reviews/${id}/status`, { status });
    return response.data;
};

// ── SITE REVIEWS & TOKENS SERVICES ──

export const fetchSiteReviews = async () => {
    const response = await API.get("/reviews/site");
    return response.data;
};

export const verifyReviewToken = async (token) => {
    const response = await API.get("/reviews/site/verify-token", { params: { token } });
    return response.data;
};

export const submitSiteReview = async (formData) => {
    const response = await API.post("/reviews/site/add", formData);
    return response.data;
};

export const generateReviewToken = async () => {
    const response = await API.post("/reviews/site/generate-token");
    return response.data;
};

export const fetchReviewTokens = async () => {
    const response = await API.get("/reviews/site/tokens");
    return response.data;
};

export const fetchAdminSiteReviews = async () => {
    const response = await API.get("/reviews/site/admin");
    return response.data;
};

export const updateSiteReviewStatus = async (id, status) => {
    const response = await API.put(`/reviews/site/${id}/status`, { status });
    return response.data;
};

export const deleteSiteReview = async (id) => {
    const response = await API.delete(`/reviews/site/${id}`);
    return response.data;
};