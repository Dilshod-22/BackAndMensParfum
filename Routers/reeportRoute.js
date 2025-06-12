
// controllers/ReportController.js

// routes/reports.js
const express = require('express');
const router = express.Router();
const ReportController = require('../Controller/ReportController');

// Oylik hisobot
// GET /api/reports/monthly?year=2024&month=12
router.get('/monthly', ReportController.getMonthlyReport);

// Mahsulot bo'yicha batafsil hisobot
// GET /api/reports/product/12345?year=2024&month=12
router.get('/product/:productId', ReportController.getProductDetailReport);

module.exports = router;