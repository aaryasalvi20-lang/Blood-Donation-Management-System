const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/profile', protect, restrictTo('donor'), donorController.getProfile);
router.put('/profile', protect, restrictTo('donor'), donorController.updateProfile);
router.put('/toggle-availability', protect, restrictTo('donor'), donorController.toggleAvailability);
router.get('/eligible', donorController.getEligibleDonors);
// Allowing hospitals to record a donation for a specific donor
router.post('/:id/donate', protect, restrictTo('hospital'), donorController.recordDonation);

// Allowing hospitals to also just fetch all donors for their dashboard view (with limits)
router.get('/', donorController.getAllDonors);

module.exports = router;
