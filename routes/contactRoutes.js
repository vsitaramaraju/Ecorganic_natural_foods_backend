const express = require('express');
const router = express.Router();
const { submitContactForm } = require('../controllers/contactController');

// POST endpoint for contact form submission
router.post('/submit', submitContactForm);

module.exports = router;
