import express from "express";
import { verifyToken, isSeller, verifyTokenOptional } from "../middlewares/authMiddleware.js";
import { 
    submitInquiry, 
    getBuyerInquiries,
    getPincodeDetails
} from "../controllers/inquiryController.js";

const router = express.Router();

// Public route to lookup Pincode details bypassing SSL and fetching accurate geocoding
router.get("/pincode/:pincode", getPincodeDetails);

// Both guest and logged-in users can submit an inquiry
router.post("/submit", verifyTokenOptional, submitInquiry);

// Seller view (DISABLED - Leads managed by Admin)
// router.get("/seller/leads", verifyToken, isSeller, getSellerLeads);

// Buyer view (My Inquiries)
router.get("/user/my-inquiries", verifyToken, getBuyerInquiries);

export default router;
