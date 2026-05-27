import API from "./api";

// Submit a buyer inquiry for a product
export const submitInquiryAPI = async (inquiryData) => {
    // inquiryData: { product_id, message, quantity }
    const response = await API.post("/inquiries/submit", inquiryData);
    return response.data;
};

// Get inquiries (leads) for a seller
export const fetchSellerLeadsAPI = async () => {
    const response = await API.get("/inquiries/seller/leads");
    return response.data;
};

// Get inquiries sent by the buyer
export const fetchBuyerInquiriesAPI = async () => {
    const response = await API.get("/inquiries/user/my-inquiries");
    return response.data;
};

// Fetch pincode details from our robust backend proxy
export const fetchPincodeDetailsAPI = async (pincode) => {
    const response = await API.get(`/inquiries/pincode/${pincode}`);
    return response.data;
};
