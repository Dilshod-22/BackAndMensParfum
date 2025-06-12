// services/MonthlyReportService.js
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const sellerModel = require('../models/User'); // Bu aslida sellerModel bo'lishi kerak

class MonthlyReportService {
  
  /**
   * Oylik hisobot olish
   * @param {number} year - Yil
   * @param {number} month - Oy (1-12)
   * @returns {Object} Hisobot ma'lumotlari
   */
  async getMonthlyReport(year, month) {
    try {
      // Oy boshlanish va tugash sanalarini aniqlash
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      console.log('Date range:', { startDate, endDate });

      // Parallel ravishda ma'lumotlarni olish
      const [incomeData, expenseData] = await Promise.all([
        this.getIncomeData(startDate, endDate),
        this.getExpenseData(startDate, endDate)
      ]);

      console.log('Income data count:', incomeData.length);
      console.log('Expense data count:', expenseData.length);
      
      // Hisobotni shakllantirish
      const report = this.formatReport(incomeData, expenseData, year, month);
      
      return report;
    } catch (error) {
      console.error('Oylik hisobot xatosi:', error);
      throw error;
    }
  }

  /**
   * Kirim ma'lumotlarini olish (sellerModel dan, status: 'consuming')
   */
  async getIncomeData(startDate, endDate) {
    try {
      // sellerModel dan consuming statusdagi ma'lumotlarni olish
      const SellerModel = mongoose.model('sellerModel');
      
      return await SellerModel.aggregate([
        {
          $match: {
            data: { $gte: startDate, $lte: endDate },
            status: 'consumption',
            // productId mavjudligini tekshirish
            productId: { $exists: true, $ne: null }
          }
        },
        {
          $addFields: {
            // productId ni ObjectId ga aylantirish (agar string bo'lsa)
            productObjectId: {
              $cond: {
                if: { $type: '$productId' },
                then: { $toObjectId: '$productId' },
                else: '$productId'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productObjectId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            totalAmount: { $multiply: ['$count', '$price'] }
          }
        },
        {
          $group: {
            _id: {
              productId: '$productObjectId',
              productName: { $ifNull: ['$product.productname', 'Noma\'lum mahsulot'] },
              userId: '$userId',
              userName: { $ifNull: ['$user.username', 'Noma\'lum foydalanuvchi'] }
            },
            totalQuantity: { $sum: '$count' },
            unitPrice: { $avg: '$price' },
            totalAmount: { $sum: '$totalAmount' },
            records: { $push: '$_id' }
          }
        },
        {
          $sort: { totalAmount: -1 }
        }
      ]);
    } catch (error) {
      console.error('Income data olishda xatolik:', error);
      return [];
    }
  }

  /**
   * Chiqim ma'lumotlarini olish (sellerModel dan)
   * sellerModel aslida User modelining bir qismi
   */
  async getExpenseData(startDate, endDate) {
    try {
      // sellerModel collection nomini to'g'rilash kerak
      // Agar alohida sellerModel collection bo'lsa
      const SellerModel = mongoose.model('sellerModel');
      
      return await SellerModel.aggregate([
        {
          $match: {
            data: { $gte: startDate, $lte: endDate },
            status: 'coming',
            // productId mavjudligini tekshirish
            productId: { $exists: true, $ne: null }
          }
        },
        {
          $addFields: {
            // productId ni ObjectId ga aylantirish (agar string bo'lsa)
            productObjectId: {
              $cond: {
                if: { $type: '$productId' },
                then: { $toObjectId: '$productId' },
                else: '$productId'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productObjectId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            totalAmount: { $multiply: ['$count', '$price'] }
          }
        },
        {
          $group: {
            _id: {
              productId: '$productObjectId',
              productName: { $ifNull: ['$product.productname', 'Noma\'lum mahsulot'] }
            },
            totalQuantity: { $sum: '$count' },
            unitPrice: { $avg: '$price' },
            totalAmount: { $sum: '$totalAmount' },
            records: { $push: '$_id' }
          }
        },
        {
          $sort: { totalAmount: -1 }
        }
      ]);
    } catch (error) {
      console.error('Expense data olishda xatolik:', error);
      // Agar sellerModel collection mavjud bo'lmasa, bo'sh array qaytarish
      return [];
    }
  }

  /**
   * Hisobotni formatlash
   */
  formatReport(incomeData, expenseData, year, month) {
    // Umumiy kirim
    const totalIncome = incomeData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    
    // Umumiy chiqim
    const totalExpense = expenseData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    
    // Foyda
    const profit = totalIncome - totalExpense;

    return {
      period: {
        year,
        month,
        monthName: this.getMonthName(month)
      },
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        profitMargin: totalIncome > 0 ? parseFloat(((profit / totalIncome) * 100).toFixed(2)) : 0
      },
      income: {
        title: 'ДОХОД (Продажи)',
        data: incomeData.map(item => ({
          productId: item._id.productId,
          productName: item._id.productName,
          userId: item._id.userId,
          userName: item._id.userName,
          quantity: item.totalQuantity || 0,
          unitPrice: Math.round((item.unitPrice || 0) * 100) / 100,
          totalAmount: Math.round((item.totalAmount || 0) * 100) / 100,
          records: item.records || []
        })),
        totalAmount: Math.round(totalIncome * 100) / 100,
        totalQuantity: incomeData.reduce((sum, item) => sum + (item.totalQuantity || 0), 0)
      },
      expense: {
        title: 'ВЫПУСК (Импортная продукция)',
        data: expenseData.map(item => ({
          productId: item._id.productId,
          productName: item._id.productName,
          quantity: item.totalQuantity || 0,
          unitPrice: Math.round((item.unitPrice || 0) * 100) / 100,
          totalAmount: Math.round((item.totalAmount || 0) * 100) / 100,
          records: item.records || []
        })),
        totalAmount: Math.round(totalExpense * 100) / 100,
        totalQuantity: expenseData.reduce((sum, item) => sum + (item.totalQuantity || 0), 0)
      }
    };
  }

  /**
   * Oy nomini olish
   */
  getMonthName(month) {
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    return months[month - 1];
  }

  /**
   * Mahsulot bo'yicha batafsil hisobot
   */
  async getProductDetailReport(productId, year, month) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Mahsulot ma'lumotlarini olish
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Mahsulot topilmadi');
      }

      // Sotuvlar
      const sales = await Order.aggregate([
        {
          $match: {
            create_date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $unwind: '$items'
        },
        {
          $match: {
            'items.productId': new mongoose.Types.ObjectId(productId)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'client_id',
            foreignField: '_id',
            as: 'client'
          }
        },
        {
          $unwind: {
            path: '$client',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            itemPrice: {
              $cond: {
                if: { $and: [{ $exists: '$items.price' }, { $ne: ['$items.price', null] }] },
                then: '$items.price',
                else: product.price
              }
            }
          }
        },
        {
          $project: {
            orderId: '$_id',
            clientName: { $ifNull: ['$client.username', 'Noma\'lum mijoz'] },
            clientId: '$client_id',
            quantity: '$items.count',
            unitPrice: '$itemPrice',
            totalAmount: { $multiply: ['$items.count', '$itemPrice'] },
            date: '$create_date',
            status: '$status'
          }
        },
        {
          $sort: { date: -1 }
        }
      ]);

      // Keltirilgan mahsulotlar
      const SellerModel = mongoose.model('sellerModel');
      const incoming = await SellerModel.find({
        $or: [
          { productId: productId },
          { productId: productId.toString() }
        ],
        data: { $gte: startDate, $lte: endDate },
        status: 'coming'
      }).sort({ data: -1 });

      return {
        product: {
          id: product._id,
          name: product.productname,
          brand: product.brand,
          currentStock: product.count
        },
        period: {
          year,
          month,
          monthName: this.getMonthName(month)
        },
        sales: {
          transactions: sales,
          totalQuantity: sales.reduce((sum, item) => sum + (item.quantity || 0), 0),
          totalAmount: sales.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
        },
        incoming: {
          transactions: incoming.map(item => ({
            id: item._id,
            quantity: item.count || 0,
            unitPrice: item.price || 0,
            totalAmount: (item.count || 0) * (item.price || 0),
            date: item.data,
            status: item.status
          })),
          totalQuantity: incoming.reduce((sum, item) => sum + (item.count || 0), 0),
          totalAmount: incoming.reduce((sum, item) => sum + ((item.count || 0) * (item.price || 0)), 0)
        }
      };
    } catch (error) {
      console.error('Mahsulot hisoboti xatosi:', error);
      throw error;
    }
  }

  /**
   * Debug uchun ma'lumotlarni tekshirish
   */
  async debugData(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    console.log('=== DEBUG INFO ===');
    console.log('Date range:', { startDate, endDate });

    // Orders soni
    const ordersCount = await Order.countDocuments({
      create_date: { $gte: startDate, $lte: endDate }
    });
    console.log('Orders count:', ordersCount);

    // Seller records soni (consuming)
    try {
      const SellerModel = mongoose.model('sellerModel');
      const consumingCount = await SellerModel.countDocuments({
        data: { $gte: startDate, $lte: endDate },
        status: 'consuming'
      });
      console.log('Consuming records count:', consumingCount);

      const comingCount = await SellerModel.countDocuments({
        data: { $gte: startDate, $lte: endDate },
        status: 'coming'
      });
      console.log('Coming records count:', comingCount);

      // Sample consuming record
      const sampleConsuming = await SellerModel.findOne({
        data: { $gte: startDate, $lte: endDate },
        status: 'consuming'
      });
      console.log('Sample consuming record:', JSON.stringify(sampleConsuming, null, 2));

      return {
        ordersCount,
        consumingCount,
        comingCount,
        sampleOrder,
        sampleConsuming,
        dateRange: { startDate, endDate }
      };
    } catch (error) {
      console.log('Seller model not found or error:', error.message);
      return {
        ordersCount,
        sampleOrder,
        dateRange: { startDate, endDate }
      };
    }
  }
}

module.exports = new MonthlyReportService();