import pool from "../config/db.js";
import { getRecommendedSellers } from "../controllers/adminController.js";

async function testMatching() {
  try {
    console.log("🔍 Starting Matching Test...");

    // 1. Create a Lead (Inquiry)
    // Product 5 is "BOPP Film 12 Mic" (Thickness: 12 Micron, Width: 500mm, Category: 3)
    // Lead is from Ghaziabad (201001) - Same as "Seller Near"
    const [inquiryResult] = await pool.query(
      `INSERT INTO inquiries (product_id, seller_id, quantity_required, thickness, width, pincode, city, state, buyer_name) 
       VALUES (5, 7, '500 kg', '12 Micron', '500mm', '201001', 'Ghaziabad', 'Uttar Pradesh', 'Test Buyer')`
    );
    const inquiryId = inquiryResult.insertId;
    console.log(`✅ Created Lead ID: ${inquiryId}`);

    // 2. Mock Request and Response
    const req = {
      params: { id: inquiryId }
    };

    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };

    // 3. Call getRecommendedSellers
    console.log("📡 Calling getRecommendedSellers...");
    await getRecommendedSellers(req, res);

    if (res.data && res.data.success) {
      console.log("✨ Recommendations Found:", res.data.recommendations.length);
      
      res.data.recommendations.forEach((s, i) => {
        console.log(`${i+1}. ${s.company_name} | Dist: ${s.distance_km?.toFixed(1)}km | Score: ${s.product_score} | Category Match: ${s.category_match}`);
      });

      // Verification
      const topSeller = res.data.recommendations[0];
      if (topSeller.company_name.includes("Near")) {
        console.log("🏆 PASS: Seller Near is Rank 1 (Distance & Exact Match)");
      } else {
        console.log("❌ FAIL: Unexpected Rank 1");
      }
    } else {
      console.log("❌ FAIL: No recommendations found or error occurred.");
      console.log(res.data);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
  }
}

testMatching();
