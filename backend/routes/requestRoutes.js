const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/', protect, restrictTo('hospital'), requestController.createRequest);
router.get('/', protect, requestController.getRequests);
router.get('/match', protect, restrictTo('hospital'), requestController.matchDonors);
router.put('/:id/status', protect, restrictTo('hospital'), requestController.updateStatus);
router.get('/:id/responses', protect, restrictTo('hospital'), requestController.getRequestResponses);

// Donor actions
router.post('/:id/respond', protect, restrictTo('donor'), requestController.respondToRequest);

module.exports = router;
