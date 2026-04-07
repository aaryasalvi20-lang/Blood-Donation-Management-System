const db = require('../db');

exports.createRequest = async (req, res) => {
    try {
        const { blood_group, units_required, urgency, location } = req.body;
        const hospital_id = req.user.id;

        const [result] = await db.execute(
            'INSERT INTO requests (hospital_id, blood_group, units_required, urgency, location) VALUES (?, ?, ?, ?, ?)',
            [hospital_id, blood_group, units_required, urgency, location]
        );

        // Smart matching logic: generate notifications for matching donors
        // Match criteria: Same blood group, Same city/location, Only eligible (last_donation > 90 days), Only available
        const [matchingDonors] = await db.execute(`
            SELECT id FROM donors 
            WHERE blood_group = ? 
              AND location = ? 
              AND is_available = true 
              AND (last_donation_date IS NULL OR DATEDIFF(CURDATE(), last_donation_date) > 90)
        `, [blood_group, location]);

        const [hospitalInfo] = await db.execute('SELECT name FROM hospitals WHERE id = ?', [hospital_id]);
        const hospitalName = hospitalInfo[0].name;

        // Insert notifications for each matching donor
        for (const donor of matchingDonors) {
            await db.execute(
                'INSERT INTO notifications (user_id, user_type, message, type) VALUES (?, ?, ?, ?)',
                [donor.id, 'donor', `Urgent request matching your blood group (${blood_group}) from ${hospitalName} in ${location}.`, 'request_match']
            );
        }

        res.status(201).json({ message: 'Request created successfully and notifications sent to matching donors.', requestId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const { id, role } = req.user;
        let query;
        let params = [];

        if (role === 'hospital') {
            // Hospitals see their own requests with a count of responses
            query = `
                SELECT r.*, 
                (SELECT COUNT(*) FROM request_responses WHERE request_id = r.id) as response_count
                FROM requests r 
                WHERE r.hospital_id = ?
                ORDER BY r.created_at DESC
            `;
            params = [id];
        } else {
            // Donors see all active requests
            query = `
                SELECT r.*, h.name as hospital_name 
                FROM requests r 
                JOIN hospitals h ON r.hospital_id = h.id 
                WHERE r.status = 'active'
                ORDER BY FIELD(r.urgency, 'critical', 'high', 'medium', 'low'), r.created_at DESC
            `;
        }

        const [requests] = await db.execute(query, params);
        res.json(requests);
    } catch (error) {
        console.error('Get Requests Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getRequestResponses = async (req, res) => {
    try {
        const requestId = req.params.id;
        const hospitalId = req.user.id;

        // Verify request ownership
        const [request] = await db.execute('SELECT id FROM requests WHERE id = ? AND hospital_id = ?', [requestId, hospitalId]);
        if (request.length === 0) return res.status(403).json({ message: 'Access denied' });

        const [responses] = await db.execute(`
            SELECT rr.*, d.name as donor_name, d.email as donor_email, d.blood_group as donor_blood_group, d.location as donor_location, d.age as donor_age
            FROM request_responses rr
            JOIN donors d ON rr.donor_id = d.id
            WHERE rr.request_id = ?
            ORDER BY rr.created_at DESC
        `, [requestId]);

        res.json(responses);
    } catch (error) {
        console.error('Get Request Responses Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.matchDonors = async (req, res) => {
    try {
        const { blood_group, location } = req.query;
        if (!blood_group || !location) {
            return res.status(400).json({ message: 'Please provide blood_group and location for matching' });
        }

        const [donors] = await db.execute(`
            SELECT id, name, email, blood_group, location, last_donation_date 
            FROM donors 
            WHERE blood_group = ? 
              AND location = ? 
              AND is_available = true 
              AND (last_donation_date IS NULL OR DATEDIFF(CURDATE(), last_donation_date) > 90)
            ORDER BY last_donation_date ASC
        `, [blood_group, location]);

        res.json(donors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const requestId = req.params.id;
        
        await db.execute('UPDATE requests SET status = ? WHERE id = ? AND hospital_id = ?', [status, requestId, req.user.id]);
        res.json({ message: 'Status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.respondToRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const donorId = req.user.id;

        // 1. Check if already responded
        const [existing] = await db.execute(
            'SELECT id FROM request_responses WHERE request_id = ? AND donor_id = ?',
            [requestId, donorId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: 'You have already accepted this request' });
        }

        // 2. Log response
        await db.execute(
            'INSERT INTO request_responses (request_id, donor_id, status) VALUES (?, ?, ?)',
            [requestId, donorId, 'accepted']
        );

        // 3. Fetch request details to notify hospital
        const [requests] = await db.execute('SELECT hospital_id, blood_group FROM requests WHERE id = ?', [requestId]);
        if (requests.length > 0) {
            const reqData = requests[0];
            const [donor] = await db.execute('SELECT name FROM donors WHERE id = ?', [donorId]);
            const donorName = donor[0].name;

            await db.execute(
                'INSERT INTO notifications (user_id, user_type, message, type) VALUES (?, ?, ?, ?)',
                [
                    reqData.hospital_id,
                    'hospital',
                    `Donor ${donorName} has accepted your request for ${reqData.blood_group} blood.`,
                    'request_response'
                ]
            );
        }

        res.json({ message: 'Response recorded successfully! The hospital has been notified.' });
    } catch (error) {
        console.error('Respond to Request Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};
