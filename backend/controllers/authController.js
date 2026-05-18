import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import fs from "fs";
import { validateEmail, validateMobile, validateGST, validatePassword } from "../utils/validation.js";
import { sendEmail } from "../utils/mailHelper.js";
import { sendNotification } from "../utils/notificationHelper.js";
import { getCoordinates } from "../utils/geoUtils.js";

const generateSellerUID = () => `PB-S-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// 1. SIGN UP (Normal User)
export const register = async (req, res) => {
  const { name, email, password, mobile } = req.body;
  try {
    // Validation
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    if (!validateEmail(email)) return res.status(400).json({ success: false, message: "Invalid email format." });
    if (!validateMobile(mobile)) return res.status(400).json({ success: false, message: "Mobile number must be exactly 10 digits." });
    if (!validatePassword(password)) return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    const hashedPassword = await bcrypt.hash(password, 10);

    // FIX: 'is_verified' explicitly set to 1 (Normal user auto-verified)
    const query =
      'INSERT INTO users (name, email, mobile, password, role, is_verified) VALUES (?, ?, ?, ?, "user", 1)';
    const [result] = await pool.query(query, [name, email, mobile, hashedPassword]);
    const userId = result.insertId;

    // Link historical guest inquiries matching this mobile number
    if (mobile) {
      await pool.query(
        "UPDATE inquiries SET buyer_id = ? WHERE phone = ? AND buyer_id IS NULL",
        [userId, mobile]
      );
    }

    res.status(201).json({ success: true, message: "Account created successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Email already exists or Database error." });
  }
};

// 2. SIGN IN (Login)
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    // FIX: Seller Verification Check
    // If the user is a seller and not verified (is_verified is 0), prevent login
    if (user.role === "seller" && user.is_verified === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Your account is pending. Please login after admin approval." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password!" });
    }

    // Sync any historical guest inquiries on login
    if (user.mobile) {
      await pool.query(
        "UPDATE inquiries SET buyer_id = ? WHERE phone = ? AND buyer_id IS NULL",
        [user.id, user.mobile]
      );
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, userName: user.name, is_verified: user.is_verified },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      token,
      role: user.role,
      userName: user.name,
      is_verified: user.is_verified,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 3. SELLER REGISTRATION
export const registerSeller = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      ownerName, email, password, mobile, businessName, businessType,
      gstNumber, yearEstablished, pincode, city, state, address, description,
    } = req.body;

    // GST Certificate validation
    if (!req.file) {
      return res.status(400).json({ success: false, message: "GST Certificate is mandatory." });
    }

    const gstCertificatePath = `uploads/gst_certificates/${req.file.filename}`;

    // Validation
    if (!ownerName || !email || !password || !businessName || !gstNumber) {
      if (req.file) fs.unlinkSync(req.file.path); // Delete uploaded file if validation fails
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }
    if (!validateEmail(email)) return res.status(400).json({ success: false, message: "Invalid email format." });
    if (!validateGST(gstNumber)) return res.status(400).json({ success: false, message: "Invalid GST number format." });
    if (!validatePassword(password)) return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    // Check Existing User
    const [existingUser] = await connection.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      await connection.rollback();
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      "INSERT INTO users (name, email, `mobile`, password, role, is_verified) VALUES (?, ?, ?, ?, 'seller', 0)",
      [ownerName, email, mobile ? String(mobile).trim() : null, hashedPassword]
    );
    const userId = userResult.insertId;

    const businessTypeString = Array.isArray(businessType) ? businessType.join(", ") : businessType;

    const sellerUID = generateSellerUID();

    await connection.query(
      `INSERT INTO sellers 
      (user_id, \`mobile\`, status, seller_uid, company_name, business_type, gst_number, gst_certificate, year_established, city, state, pincode, business_address, description, is_verified) 
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        userId, 
        mobile ? String(mobile).trim() : null, 
        sellerUID, 
        businessName, 
        businessTypeString, 
        gstNumber, 
        gstCertificatePath,
        yearEstablished || null, 
        city, 
        state, 
        pincode || null, 
        address, 
        description
      ]
    );

    await connection.commit();

    // 4. Pre-fetch and cache Seller Coordinates (Awaited to ensure distance logic works immediately)
    if (pincode) {
      await getCoordinates(pincode).catch(err => console.error("Error updating seller coordinates:", err));
    }

    // --- EMAIL & IN-APP NOTIFICATIONS ---
    try {
      // 1. Notify Admins (Email + In-App)
      const [admins] = await connection.query("SELECT id, email FROM users WHERE role = 'admin'");
      
      const adminSubject = "New Seller Registration - Action Required";
      const adminMessage = `A new seller "${businessName}" has registered and is pending approval.`;
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #2c3e50;">New Seller Registered</h2>
          <p>${adminMessage}</p>
          <hr>
          <p><strong>Seller Name:</strong> ${ownerName}</p>
          <p><strong>Business Name:</strong> ${businessName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>GST Number:</strong> ${gstNumber}</p>
          <p><strong>City:</strong> ${city}</p>
          <hr>
          <p>Please login to the Admin Dashboard to verify and approve this account.</p>
        </div>
      `;

      for (const admin of admins) {
        // Send In-App Notification (which also sends email internally)
        await sendNotification({
          userId: admin.id,
          userRole: 'admin',
          title: adminSubject,
          message: adminMessage,
          type: 'registration',
          link: '/admin/pending-sellers'
        });
      }

      // 2. Notify Seller (Acknowledge)
      const sellerSubject = "Registration Received - PackagingBazaar";
      const sellerHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #2c3e50;">Registration Received!</h2>
          <p>Hi ${ownerName},</p>
          <p>Thank you for registering your business <strong>${businessName}</strong> with PackagingBazaar.</p>
          <p>Your application is currently <strong>Pending Admin Approval</strong>. Once our team verifies your GST details, your account will be activated.</p>
          <p>We will notify you once your account is approved.</p>
          <br>
          <p>Regards,<br>Team PackagingBazaar</p>
        </div>
      `;
      await sendEmail(email, sellerSubject, "Your registration is pending approval.", sellerHtml);

    } catch (mailError) {
      console.error("Notification Error (registration):", mailError);
    }

    res.status(201).json({
      success: true,
      message: "Application submitted! Admin will verify your account shortly.",
    });
  } catch (error) {
    await connection.rollback();
    if (req.file) fs.unlinkSync(req.file.path);
    console.error("Seller Registration Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    connection.release();
  }
};


// 4. GET CURRENT USER
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    // FIX: Include 'is_verified' and 'mobile' to inform the frontend of the status
    const [rows] = await pool.query("SELECT id, name, email, mobile, role, is_verified FROM users WHERE id = ?", [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }
    
    res.status(200).json({ success: true, user: rows[0] });
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};