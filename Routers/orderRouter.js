const Route = require("express").Router();

const {
    createOrder,getUserOrders,getAllOrders,updateOrderStatus,allStatistic,getStats,receiveProduct
} = require("../Controller/orderCTRl");
const Product = require("../models/Product");
const sellerModel = require("../models/sellerModel");

Route.post("/createOrder",createOrder);
Route.get("/getUserProduct/:id",getUserOrders);
Route.get("/getAllOrders",getAllOrders);
Route.post("/updateOrderStatus",updateOrderStatus);
Route.get("/getStatistic",allStatistic);
Route.get("/getStats",getStats);
Route.post("/receiveProduct",receiveProduct)
Route.get('/short', async (req, res) => {
  try {
    const products = await Product.find();

    const simplified = products.map((p) => ({
      id: p._id.toString(),
      name: p.productname,
      brand: p.brand,
      category: p.category,
      price: p.price,
      image:
        p.productimage.find((img) => img.status === 'main')?.imageLink ||
        'https://via.placeholder.com/64x64.png?text=No+Image',
    }));

    res.json(simplified);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

Route.get('/summary', async (req, res) => {
  try {
    const summary = await sellerModel.aggregate([
      {
        $group: {
          _id: '$productId',
          comingCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'coming'] }, '$count', 0]
            }
          },
          consumptionCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'consumption'] }, '$count', 0]
            }
          },
          totalSold: {
            $sum: {
              $cond: [{ $eq: ['$status', 'consumption'] }, '$price', 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          minStockLevel: '$comingCount',
          totalSold: 1,
          currentStock: { $subtract: ['$comingCount', '$consumptionCount'] }
        }
      }
    ]);

    res.json(summary);
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = Route;