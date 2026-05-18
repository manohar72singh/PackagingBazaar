import pool from "../config/db.js";
import { sendNotification } from "../utils/notificationHelper.js";
import { sendEmail } from "../utils/mailHelper.js";
import { getCoordinates } from "../utils/geoUtils.js";

// 1. Submit a Buyer Inquiry (Lead)
export const submitInquiry = async (req, res) => {
    try {
        const { 
            product_id, 
            message, 
            quantity, 
            thickness, 
            width, 
            phone, 
            pincode, 
            city,
            state,
            address,
            buyer_name, 
            buyer_email 
        } = req.body;

        const buyer_id = req.user?.id || null;

        if (!product_id) {
            return res.status(400).json({ success: false, message: "Product ID is required." });
        }

        const [pRows] = await pool.query(`
            SELECT COALESCE(p.seller_id, sp.seller_id) as seller_id 
            FROM products p
            LEFT JOIN seller_products sp ON p.id = sp.product_id
            WHERE p.id = ?
            LIMIT 1
        `, [product_id]);

        if (pRows.length === 0) {
            return res.status(404).json({ success: false, message: `Product ID ${product_id} not found.` });
        }

        const seller_id = pRows[0].seller_id;
        if (!seller_id) {
            return res.status(400).json({ success: false, message: "Error: No manufacturer linked to this product." });
        }

        const query = `
            INSERT INTO inquiries 
            (buyer_id, product_id, seller_id, message, quantity_required, thickness, width, phone, pincode, city, state, address, buyer_name, buyer_email) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            buyer_id, product_id, seller_id, message, quantity, thickness || null, width || null,
            phone || null, pincode || null, city || null, state || null, address || null,
            buyer_name || null, buyer_email || null
        ];

        const [result] = await pool.query(query, values);
        
        // Ensure coordinates exist for accurate distance matching
        if (pincode) {
            await getCoordinates(pincode).catch(err => console.error("Error updating lead coordinates:", err));
        }

        // Notify Admin
        try {
            const newLeadId = result.insertId;
            const [adminRows] = await pool.query("SELECT id, email FROM users WHERE role = 'admin' LIMIT 1");
            if (adminRows.length > 0) {
                const admin = adminRows[0];

                // Platform notification
                await sendNotification({
                    userId: admin.id,
                    userRole: 'admin',
                    title: 'New Bulk Inquiry Received',
                    message: `New lead PB-LID-${newLeadId} received from ${buyer_name || 'a Buyer'} for ${buyer_name || 'product'}.`,
                    type: 'lead',
                    link: '/admin/inquiries'
                });

                // Email notification to admin
                if (admin.email) {
                    const [pName] = await pool.query("SELECT name FROM products WHERE id = ? LIMIT 1", [product_id]);
                    const productName = pName[0]?.name || `Product #${product_id}`;
                    const emailSubject = `[New Lead] PB-LID-${newLeadId}: ${productName} Inquiry`;
                    const emailHtml = `
                        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 12px;">
                            <h2 style="color: #e8511a; margin-top: 0;">🔔 New Lead Received</h2>
                            <p>Hello Admin,</p>
                            <p>A new buyer inquiry has been submitted on PackagingBazaar. Please review and assign it to a suitable seller.</p>
                            <div style="background: #f9fafb; padding: 20px; border-radius: 10px; border-left: 5px solid #e8511a; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Lead ID:</strong> PB-LID-${newLeadId}</p>
                                <p style="margin: 5px 0;"><strong>Product:</strong> ${productName}</p>
                                <p style="margin: 5px 0;"><strong>Buyer Name:</strong> ${buyer_name || 'N/A'}</p>
                                <p style="margin: 5px 0;"><strong>Quantity:</strong> ${quantity || 'Not specified'}</p>
                                ${thickness ? `<p style="margin: 5px 0;"><strong>Thickness:</strong> ${thickness} Micron</p>` : ''}
                                ${width ? `<p style="margin: 5px 0;"><strong>Width:</strong> ${width}</p>` : ''}
                                <p style="margin: 5px 0;"><strong>Location:</strong> ${city || ''}, ${state || ''} - ${pincode || ''}</p>
                                ${message ? `<p style="margin: 10px 0 0 0; font-style: italic; color: #666;"><strong>Message:</strong> ${message}</p>` : ''}
                            </div>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://packagingbazaar.co.in/admin/inquiries" style="display: inline-block; background: #e8511a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Review Lead on Dashboard</a>
                            </div>
                        </div>
                    `;
                    await sendEmail(admin.email, emailSubject, "", emailHtml);
                }
            }
        } catch (notifErr) {
            console.error("Notification Error:", notifErr);
        }

        res.status(201).json({
            success: true,
            message: "Requirement sent successfully",
            leadId: result.insertId
        });
    } catch (err) {
        console.error("CRITICAL ERROR in submitInquiry controller:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// 3. Get Inquiries sent by a Buyer (User dashboard)
export const getBuyerInquiries = async (req, res) => {
    try {
        const buyer_id = req.user.id;
        const query = `
            SELECT i.*, p.name as product_name, p.image_url, s.company_name as seller_name
            FROM inquiries i
            JOIN products p ON i.product_id = p.id
            JOIN sellers s ON i.seller_id = s.id
            WHERE i.buyer_id = ?
            ORDER BY i.created_at DESC
        `;
        const [rows] = await pool.query(query, [buyer_id]);
        res.status(200).json({ success: true, inquiries: rows });
    } catch (err) {
        console.error("Error fetching buyer inquiries:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 4. Share Lead to Seller (Admin Only)
export const shareLeadToSeller = async (req, res) => {
    try {
        const { id } = req.params; // inquiry_id
        const { seller_id: providedSellerId, assignment_note } = req.body;

        let seller_id = providedSellerId;

        // Fetch inquiry details if seller_id is not provided or for email content
        const [inquiryRows] = await pool.query(`
            SELECT i.*, p.name as product_name 
            FROM inquiries i 
            JOIN products p ON i.product_id = p.id 
            WHERE i.id = ?
        `, [id]);

        if (inquiryRows.length === 0) return res.status(404).json({ success: false, message: "Inquiry not found" });
        const inquiry = inquiryRows[0];

        if (!seller_id) {
            seller_id = inquiry.seller_id;
        }

        // 1. Check if already assigned to this seller
        const [existing] = await pool.query("SELECT assignment_status FROM lead_assignments WHERE inquiry_id = ? AND seller_id = ?", [id, seller_id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "This lead is already shared with this seller." });
        }

        // 2. Insert Assignment
        const query = `
            INSERT INTO lead_assignments (inquiry_id, seller_id, assignment_note) 
            VALUES (?, ?, ?) 
        `;
        await pool.query(query, [id, seller_id, assignment_note || null]);
        await pool.query("UPDATE inquiries SET is_assigned = 1, assigned_at = NOW() WHERE id = ?", [id]);

        // 3. Fetch Seller Email for Notification
        const [sellerRows] = await pool.query(`
            SELECT s.company_name, u.email, u.id as user_id 
            FROM sellers s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.id = ?
        `, [seller_id]);

        if (sellerRows.length > 0) {
            const seller = sellerRows[0];

            // Platform Notification
            try {
                await sendNotification({
                    userId: seller.user_id,
                    userRole: 'seller',
                    title: 'New Lead Assigned',
                    message: `Admin has assigned a new verified lead (ID: PB-LID-${id}) to you.`,
                    type: 'lead',
                    link: '/seller/leads'
                });
            } catch (notifErr) { console.error("Notification Error:", notifErr); }

            // Email Notification
            const emailSubject = `[New Lead] PB-LID-${id}: ${inquiry.product_name} Requirement`;
            const emailHtml = `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #e8511a;">New Business Lead Assigned</h2>
                    <p>Hello <strong>${seller.company_name}</strong>,</p>
                    <p>Admin has shared a new verified inquiry with you. Please review the details below:</p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 10px; border-left: 4px solid #e8511a;">
                        <p><strong>Lead ID:</strong> PB-LID-${id}</p>
                        <p><strong>Product:</strong> ${inquiry.product_name}</p>
                        <p><strong>Quantity:</strong> ${inquiry.quantity_required || 'Not specified'}</p>
                        <p><strong>Specs:</strong> ${inquiry.thickness || ''} ${inquiry.width || ''}</p>
                        <p><strong>Location:</strong> ${inquiry.city}, ${inquiry.state} - ${inquiry.pincode}</p>
                        <p><strong>Address:</strong> ${inquiry.address || 'N/A'}</p>
                    </div>
                    <p><em>Note: Buyer contact information is hidden for privacy. Please update your status on the dashboard to coordinate with Admin.</em></p>
                    <a href="https://packagingbazaar.co.in/seller/dashboard" style="display: inline-block; background: #e8511a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">View on Dashboard</a>
                </div>
            `;
            await sendEmail(seller.email, emailSubject, "", emailHtml);
        }

        res.status(200).json({ success: true, message: "Lead shared successfully!" });
    } catch (err) {
        console.error("Error sharing lead:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 5. Get Leads Assigned to a Seller (Seller Dashboard)
export const getSellerLeads = async (req, res) => {
    try {
        const userId = req.user.id;
        const [sellerRows] = await pool.query("SELECT id FROM sellers WHERE user_id = ?", [userId]);
        if (sellerRows.length === 0) {
            return res.status(404).json({ success: false, message: "Seller profile not found." });
        }
        const seller_id = sellerRows[0].id;

        // NOTE: phone, buyer_email, buyer_name are EXCLUDED for privacy as per requirements
        const query = `
            SELECT i.id, i.product_id, i.message, i.quantity_required, i.thickness, i.width,
                   i.pincode, i.city, i.state, i.address, i.created_at,
                   p.name as product_name, p.image_url, p.color,
                   COALESCE(
                     sp.delivery_hours,
                     (SELECT MIN(sp2.delivery_hours) FROM seller_products sp2 WHERE sp2.product_id = i.product_id AND sp2.delivery_hours IS NOT NULL),
                     p.delivery_time
                   ) as delivery_hours,
                   la.id as assignment_id, la.assigned_at, la.assignment_note, la.assignment_status
            FROM lead_assignments la
            JOIN inquiries i ON la.inquiry_id = i.id
            JOIN products p ON i.product_id = p.id
            LEFT JOIN seller_products sp ON i.product_id = sp.product_id AND sp.seller_id = la.seller_id
            WHERE la.seller_id = ?
            ORDER BY la.assigned_at DESC
        `;
        const [rows] = await pool.query(query, [seller_id]);
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error("Error fetching seller leads:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// 6. Update Lead Assignment Status (Seller Side)
export const updateAssignmentStatus = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { status, seller_notes } = req.body;
        const userId = req.user.id;

        // Verify seller ownership
        const [check] = await pool.query(`
            SELECT la.id FROM lead_assignments la 
            JOIN sellers s ON la.seller_id = s.id 
            WHERE la.id = ? AND s.user_id = ?
        `, [assignmentId, userId]);

        if (check.length === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized or Assignment not found." });
        }

        const validStatuses = ['pending', 'accepted', 'rejected', 'fulfilled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }

        await pool.query(
            "UPDATE lead_assignments SET assignment_status = ?, seller_notes = ? WHERE id = ?",
            [status, seller_notes || null, assignmentId]
        );

        // Notify Admin if lead is fulfilled or rejected
        if (status === 'fulfilled' || status === 'rejected') {
            try {
                const [details] = await pool.query(`
                    SELECT i.id as inquiry_id, s.company_name, u.mobile as seller_phone
                    FROM lead_assignments la
                    JOIN inquiries i ON la.inquiry_id = i.id
                    JOIN sellers s ON la.seller_id = s.id
                    JOIN users u ON s.user_id = u.id
                    WHERE la.id = ?
                `, [assignmentId]);

                if (details.length > 0) {
                    const lead = details[0];
                    const [admins] = await pool.query("SELECT id, email FROM users WHERE role = 'admin' LIMIT 1");
                    
                    if (admins.length > 0) {
                        const admin = admins[0];
                        
                        const title = status === 'fulfilled' ? 'Lead Fulfilled' : 'Lead Rejected';
                        const statusColor = status === 'fulfilled' ? '#22c55e' : '#ef4444';
                        
                        // 1. Platform Notification
                        await sendNotification({
                            userId: admin.id,
                            userRole: 'admin',
                            title: title,
                            message: `Seller ${lead.company_name} has marked Lead PB-LID-${lead.inquiry_id} as ${status.charAt(0).toUpperCase() + status.slice(1)}.`,
                            type: 'lead',
                            link: '/admin/inquiries'
                        });

                        // 2. Email Notification
                        const subject = `[${status.toUpperCase()}] Lead PB-LID-${lead.inquiry_id} by ${lead.company_name}`;
                        const html = `
                            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eee; border-radius: 12px;">
                                <h2 style="color: ${statusColor}; margin-top: 0;">${status === 'fulfilled' ? '✓' : '✗'} Lead ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
                                <p>Hello Admin,</p>
                                <p>The seller <strong>${lead.company_name}</strong> has updated the status of an assigned lead.</p>
                                
                                <div style="background: #f9fafb; padding: 20px; border-radius: 10px; border-left: 5px solid ${statusColor}; margin: 20px 0;">
                                    <p style="margin: 5px 0;"><strong>Lead ID:</strong> PB-LID-${lead.inquiry_id}</p>
                                    <p style="margin: 5px 0;"><strong>Seller:</strong> ${lead.company_name}</p>
                                    <p style="margin: 5px 0;"><strong>Seller Phone:</strong> <a href="tel:${lead.seller_phone}" style="color: #4f46e5; text-decoration: none; font-weight: bold;">${lead.seller_phone || 'N/A'}</a></p>
                                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${status}</span></p>
                                    <p style="margin: 10px 0 0 0; font-style: italic; color: #666;"><strong>Seller Notes:</strong> ${seller_notes || 'No notes provided'}</p>
                                </div>

                                <p>You can review this assignment and take necessary actions (like re-assigning if rejected) from your dashboard.</p>
                                
                                <div style="text-align: center; margin-top: 30px;">
                                    <a href="https://packagingbazaar.co.in/admin/inquiries" style="display: inline-block; background: #000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Open Admin Dashboard</a>
                                </div>
                            </div>
                        `;
                        await sendEmail(admin.email, subject, "", html);
                    }
                }
            } catch (notifErr) {
                console.error("Status Change Notification Error:", notifErr);
            }
        }

        res.status(200).json({ success: true, message: "Status updated successfully!" });
    } catch (err) {
        console.error("Error updating assignment status:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
