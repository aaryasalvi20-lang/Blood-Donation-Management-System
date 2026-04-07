const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_jwt_key_12345', {
        expiresIn: '30d',
    });
};

exports.registerDonor = async (req, res) => {
    try {
        const { name, email, password, blood_group, age, location, last_donation_date } = req.body;

        // Check if donor exists
        const [existing] = await db.execute('SELECT email FROM donors WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            'INSERT INTO donors (name, email, password, blood_group, age, location, last_donation_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, blood_group, age, location, last_donation_date || null]
        );

        const token = generateToken(result.insertId, 'donor');
        res.status(201).json({ id: result.insertId, name, email, role: 'donor', token });
    } catch (error) {
        console.error('Registration Error (Donor):', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

exports.loginDonor = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [donors] = await db.execute('SELECT * FROM donors WHERE email = ?', [email]);
        
        if (donors.length === 0) return res.status(400).json({ message: 'Invalid credentials' });
        
        const donor = donors[0];
        const isMatch = await bcrypt.compare(password, donor.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = generateToken(donor.id, 'donor');
        res.json({ id: donor.id, name: donor.name, email: donor.email, role: 'donor', token });
    } catch (error) {
        console.error('Registration Error (Donor):', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

exports.registerHospital = async (req, res) => {
    try {
        const { name, email, password, location } = req.body;

        const [existing] = await db.execute('SELECT email FROM hospitals WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            'INSERT INTO hospitals (name, email, password, location) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, location]
        );

        const token = generateToken(result.insertId, 'hospital');
        res.status(201).json({ id: result.insertId, name, email, role: 'hospital', token });
    } catch (error) {
        console.error('Registration Error (Donor):', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

exports.loginHospital = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [hospitals] = await db.execute('SELECT * FROM hospitals WHERE email = ?', [email]);
        
        if (hospitals.length === 0) return res.status(400).json({ message: 'Invalid credentials' });
        
        const hospital = hospitals[0];
        const isMatch = await bcrypt.compare(password, hospital.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = generateToken(hospital.id, 'hospital');
        res.json({ id: hospital.id, name: hospital.name, email: hospital.email, role: 'hospital', token });
    } catch (error) {
        console.error('Registration Error (Donor):', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const table = req.user.role === 'donor' ? 'donors' : 'hospitals';
        const [users] = await db.execute(`SELECT * FROM ${table} WHERE id = ?`, [req.user.id]);
        
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const user = users[0];
        delete user.password; // Security
        res.json(user);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { role, id } = req.user;
        const { name, location, blood_group, age } = req.body;
        
        if (role === 'donor') {
            const [current] = await db.execute('SELECT * FROM donors WHERE id = ?', [id]);
            if (current.length === 0) return res.status(404).json({ message: 'Donor not found' });
            const donor = current[0];

            await db.execute(
                'UPDATE donors SET name = ?, blood_group = ?, age = ?, location = ? WHERE id = ?',
                [
                    name !== undefined ? name : donor.name,
                    blood_group !== undefined ? blood_group : donor.blood_group,
                    age !== undefined ? age : donor.age,
                    location !== undefined ? location : donor.location,
                    id
                ]
            );
        } else if (role === 'hospital') {
            const [current] = await db.execute('SELECT * FROM hospitals WHERE id = ?', [id]);
            if (current.length === 0) return res.status(404).json({ message: 'Hospital not found' });
            const hospital = current[0];

            await db.execute(
                'UPDATE hospitals SET name = ?, location = ? WHERE id = ?',
                [
                    name !== undefined ? name : hospital.name,
                    location !== undefined ? location : hospital.location,
                    id
                ]
            );
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};
