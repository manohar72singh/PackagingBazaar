import pool from "../config/db.js";
import { sendNotification } from "../utils/notificationHelper.js";
import { sendEmail } from "../utils/mailHelper.js";

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
export const submitContactMessage = async (req, res) => {
  try {
    const { name, company_name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Please provide name, email and message." });
    }

    const query = `
      INSERT INTO contact_messages (name, company_name, email, phone, subject, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [name, company_name, email, phone, subject, message]);
    const messageId = result.insertId;

    // Send immediate response to user
    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully. We will get back to you soon.",
    });

    // Run notifications and emails in the background (Non-blocking)
    (async () => {
      try {
        // 1. Notify Admin (Real-time & Dashboard)
        const [adminRows] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        const adminId = adminRows[0]?.id;

        if (adminId) {
          await sendNotification({
            userId: adminId,
            userRole: 'admin',
            title: "New Contact Inquiry",
            message: `New message from ${name} (${company_name || 'N/A'}). Subject: ${subject || 'No Subject'}`,
            type: 'info',
            link: '/admin/contacts'
          });
        }

        // 2. Send Detailed Email to Admin
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        const adminMailHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
              <div style="background-color: #2563eb; padding: 20px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0; font-size: 24px;">New Contact Inquiry</h2>
              </div>
              <div style="padding: 30px; color: #374151;">
                <p style="margin-bottom: 20px; font-size: 16px;">You have received a new message from the website contact form.</p>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">Name:</td><td>${name}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Company:</td><td>${company_name || 'N/A'}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td>${email}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Phone:</td><td>${phone || 'N/A'}</td></tr>
                  <tr><td style="padding: 8px 0; font-weight: bold;">Subject:</td><td>${subject || 'No Subject'}</td></tr>
                </table>
                <div style="margin-top: 25px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
                  <p style="font-weight: bold; margin-top: 0;">Message:</p>
                  <p style="margin-bottom: 0; white-space: pre-wrap;">${message}</p>
                </div>
                <div style="margin-top: 30px; text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/contacts" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">View in Dashboard</a>
                </div>
              </div>
            </div>
          </div>
        `;
        await sendEmail(adminEmail, `New Contact Inquiry: ${subject || 'Website Message'}`, `New inquiry from ${name}`, adminMailHtml);

        // 3. Send Auto-Reply to User
        const userMailHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background-color: #f9fafb;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
              <div style="background-color: #059669; padding: 20px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Message Received!</h2>
              </div>
              <div style="padding: 30px; color: #374151;">
                <p style="font-size: 18px; font-weight: bold; color: #111827;">Hello ${name},</p>
                <p style="line-height: 1.6;">Thank you for reaching out to <strong>PackagingBazaar</strong>. We have successfully received your inquiry regarding "<em>${subject || 'General Inquiry'}</em>".</p>
                <p style="line-height: 1.6;">Our team is reviewing your message and will get back to you at <strong>${email}</strong> or <strong>${phone || 'your phone number'}</strong> as soon as possible (usually within 24 hours).</p>
                <div style="margin: 30px 0; padding: 20px; border-left: 4px solid #059669; background-color: #ecfdf5;">
                  <p style="font-style: italic; color: #065f46; margin: 0;">"Our goal is to provide you with the best packaging solutions for your business."</p>
                </div>
                <p style="margin-top: 30px;">Best Regards,<br><strong>Team PackagingBazaar</strong></p>
              </div>
              <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                © 2026 PackagingBazaar. All rights reserved.
              </div>
            </div>
          </div>
        `;
        await sendEmail(email, "We've received your message - PackagingBazaar", "Thank you for contacting us!", userMailHtml);
      } catch (bgError) {
        console.error("Background task error in submitContactMessage:", bgError);
      }
    })();

  } catch (error) {
    console.error("Error in submitContactMessage:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all contact messages (Admin Only)
// @route   GET /api/admin/contacts
// @access  Private/Admin
export const getAllContactMessages = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Error in getAllContactMessages:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update contact message status
// @route   PUT /api/admin/contacts/:id
// @access  Private/Admin
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query("UPDATE contact_messages SET status = ? WHERE id = ?", [status, id]);

    res.status(200).json({
      success: true,
      message: "Status updated successfully.",
    });
  } catch (error) {
    console.error("Error in updateContactStatus:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
