const db = require('../db');

exports.getProfile = async (req, res) => {
    try {
        const [donors] = await db.execute('SELECT id, name, email, blood_group, age, location, last_donation_date, is_available, created_at FROM donors WHERE id = ?', [req.user.id]);
        if (donors.length === 0) return res.status(404).json({ message: 'Donor not found' });
        res.json(donors[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, blood_group, age, location } = req.body;
        
        // Fetch current values first to support partial updates
        const [current] = await db.execute('SELECT * FROM donors WHERE id = ?', [req.user.id]);
        if (current.length === 0) return res.status(404).json({ message: 'Donor not found' });
        
        const donor = current[0];

        await db.execute(
            'UPDATE donors SET name = ?, blood_group = ?, age = ?, location = ? WHERE id = ?',
            [
                name !== undefined ? name : donor.name,
                blood_group !== undefined ? blood_group : donor.blood_group,
                age !== undefined ? age : donor.age,
                location !== undefined ? location : donor.location,
                req.user.id
            ]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

exports.recordDonation = async (req, res) => {
    try {
        const donorId = req.params.id;
        const hospitalId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // 1. Update donor's last donation date
        const [result] = await db.execute(
            'UPDATE donors SET last_donation_date = ? WHERE id = ?',
            [today, donorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Donor not found' });
        }

        // 2. Add to donation history
        await db.execute(
            'INSERT INTO donation_history (donor_id, donation_date, hospital_id, notes) VALUES (?, ?, ?, ?)',
            [donorId, today, hospitalId, 'Donation recorded by hospital']
        );

        res.json({ message: 'Donation recorded successfully' });
    } catch (error) {
        console.error('Record Donation Error:', error);
        res.status(500).json({ message: 'Server error tracking donation: ' + error.message });
    }
};

exports.toggleAvailability = async (req, res) => {
    try {
        const { is_available } = req.body;
        await db.execute('UPDATE donors SET is_available = ? WHERE id = ?', [is_available, req.user.id]);
        res.json({ message: 'Availability updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getEligibleDonors = async (req, res) => {
    try {
        // Eligibility: last_donation_date > 90 days ago or null
        const [donors] = await db.execute(`
            SELECT id, name, blood_group, location, last_donation_date, is_available 
            FROM donors 
            WHERE is_available = true AND (last_donation_date IS NULL OR DATEDIFF(CURDATE(), last_donation_date) > 90)
        `);
        res.json(donors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllDonors = async (req, res) => {
    try {
        const [donors] = await db.execute('SELECT id, name, blood_group, location, last_donation_date, is_available FROM donors');
        // Calculate eligibility on the fly to return to frontend
        const mappedDonors = donors.map(d => {
            let eligible = true;
            if (d.last_donation_date) {
                const diffTime = Math.abs(new Date() - new Date(d.last_donation_date));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays <= 90) eligible = false;
            }
            return { ...d, is_eligible: eligible };
        });
        res.json(mappedDonors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
