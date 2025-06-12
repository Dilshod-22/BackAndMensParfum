const MonthlyReportService = require('../services/MonthlyReportService');

class ReportController {
  
  /**
   * Oylik hisobot olish
   */
  async getMonthlyReport(req, res) {
    try {
      const { year, month } = req.query;
      
      // Validatsiya
      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: 'Yil va oy ko\'rsatilishi kerak'
        });
      }

      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      if (yearNum < 2020 || yearNum > 2030 || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: 'Noto\'g\'ri yil yoki oy'
        });
      }

      const report = await MonthlyReportService.getMonthlyReport(yearNum, monthNum);

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      console.error('Hisobot xatosi:', error);
      res.status(500).json({
        success: false,
        message: 'Server xatosi',
        error: error.message
      });
    }
  }

  /**
   * Mahsulot bo'yicha batafsil hisobot
   */
  async getProductDetailReport(req, res) {
    try {
      const { productId } = req.params;
      const { year, month } = req.query;

      if (!productId || !year || !month) {
        return res.status(400).json({
          success: false,
          message: 'ProductId, yil va oy ko\'rsatilishi kerak'
        });
      }

      const report = await MonthlyReportService.getProductDetailReport(
        productId, 
        parseInt(year), 
        parseInt(month)
      );

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      console.error('Mahsulot hisoboti xatosi:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Server xatosi'
      });
    }
  }
}

module.exports = new ReportController();
