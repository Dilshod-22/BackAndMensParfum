const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const sellerModel = require("../models/sellerModel")

// 1. createOrder
// POST /api/orders
async function createOrder(req, res) {
  try {
    const { create_date, itemsK, status, client_id, address } = req.body;
    console.log(req.body);

    const newOrder = new Order({
      create_date: create_date || Date.now(),
      items: itemsK.map((it) => ({
        productId: it.productId,
        count: it.count,
        price: it.price
      })),
      status,
      client_id,
      address,
    });

    // Barcha kerak() chaqiruvlarini to‘plab, kutamiz
    await Promise.all(
      itemsK.map((itv) => kerak(itv, client_id,create_date))
    );

    const saved = await newOrder.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Order insert failed:', err);
    res.status(500).json({ error: err.message });
  }
}

// kerak() funktsiyasi to‘g‘rilangan
const kerak = async (itv, client_id,create_date) => {
  const newEntry = new sellerModel({
    productId: itv.productId,
    count: itv.count,
    price: itv.price,
    status: 'consumption',
    userId: client_id,
    data:create_date
  });

  await newEntry.save();
};


// try {
//     const { productId, quantity, unitPrice, status } = req.body;

//     const newEntry = new sellerModel({
//       productId: productId || 'Product',
//       count: quantity,
//       price: unitPrice,
//       status: status || 'consumption',
//     });

//     await newEntry.save();

//     res.status(201).json({ message: 'Ma’lumot saqlandi', data: newEntry });
//   } catch (error) {
//     console.error('Xatolik:', error);
//     res.status(500).json({ message: 'Ichki server xatosi', error: error.message });
//   }
// 2. getUserOrders
// GET /api/orders/user/:id
// id: user_id
async function getUserOrders(req, res) {
  console.log("keldi");
  
 try {
    const userId = req.params.id;
    console.log(userId);
    
    // Fixed: Added 'new' keyword
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      { $match: { client_id: objectUserId } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$_id',
          client_id: { $first: '$client_id' },
          status: { $first: '$status' },
          create_date: { $first: '$create_date' },
          address: { $first: '$address' },
          items: {
            $push: {
              product_id: '$product._id',
              productname: '$product.productname',
              brand: '$product.brand',
              price: '$product.price',
              category: '$product.category',
              sku: '$product.sku',
              // thumbnail: birinchi thumbnail imageLink
              thumbnail: {
                $let: {
                  vars: {
                    thumbs: {
                      $filter: {
                        input: '$product.productimage',
                        cond: { $eq: ['$$this.status', 'main'] },
                      },
                    },
                  },
                  in: { $arrayElemAt: ['$$thumbs.imageLink', 0] },
                },
              },
              quantity: '$items.count',
            },
          },
          total: {
            $sum: { $multiply: ['$product.price', '$items.count'] },
          },
        },
      },
      { $sort: { create_date: -1 } },
    ];

    const orders = await Order.aggregate(pipeline);
    res.json(orders);
  } catch (err) {
    console.error('getUserOrders error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
}

// 3. getAllOrders
// GET /api/orders
async function getAllOrders(req, res) {
  try {
    /**
     * Pipeline:
     * 1) unwind items
     * 2) lookup product
     * 3) lookup user
     * 4) group qayta yig'ish
     */
    const pipeline = [
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'users',
          localField: 'client_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$_id',
          client_id: { $first: '$client_id' },
          client_name: { $first: '$user.username' },
          client_phone: { $first: '$user.phone_number' }, // Added phone number
          client_address: { $first: '$user.address' }, // Added user address
          status: { $first: '$status' },
          create_date: { $first: '$create_date' },
          address: { $first: '$address' },
          items: {
            $push: {
              product_id: '$product._id',
              productname: '$product.productname',
              brand: '$product.brand',
              price: '$product.price',
              category: '$product.category',
              sku: '$product.sku',
              images: '$product.productimage', // Barcha rasmlarni olish
              quantity: '$items.count',
            },
          },
          total: {
            $sum: { $multiply: ['$product.price', '$items.count'] },
          },
        },
      },
      { $sort: { create_date: -1 } },
    ];

    const orders = await Order.aggregate(pipeline);
    res.json(orders);
  } catch (err) {
    console.error('getAllOrders error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
}// 4. updateOrderStatus
// PUT /api/orders/status
async function updateOrderStatus(req, res) {
  console.log(req.body);
  
  try {
    const { orderId, status } = req.body;
    const updated = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status } },
      { new: true }
    );
    if(status==="cancelled"){
      const datach = await sellerModel.findOneAndUpdate(
      { userId: updated.client_id, data: updated.create_date },
      { $set: { status: "otmena" } }
    );
      console.log('kirdi');
      
  }
    if (!updated) {
      return res.status(404).json({ error: 'Order topilmadi' });
    }
    res.json({ message: 'success', order: updated });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
}

// 5. allStatistic
// GET /api/orders/statistics
async function allStatistic(req, res) {
  try {
    const [productCount, userCount, ordersCount] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
    ]);
    res.json({ product_count: productCount, user_count: userCount, orders_count: ordersCount });
  } catch (err) {
    console.error('allStatistic error:', err);
    res.status(500).json({ error: 'Server xatosi' });
  }
}

async function getStats(req,res) {
 try {
    // 1. Order status count
    const counts = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Total orders
    const total = await Order.countDocuments();

    // 3. Umumiy narx (barcha buyurtmalardagi barcha product price yig'indisi)
    const totalPriceAgg = await Order.aggregate([
      { $unwind: "$items" }, // Har bir item alohida
      {
        $lookup: {
          from: "products", // e'tibor: bu yerda collection nomi *plural* bo'lishi kerak
          localField: "items.productId",
          foreignField: "_id",
          as: "productData"
        }
      },
      { $unwind: "$productData" }, // productData ni ochamiz
      {
        $group: {
          _id: null,
          totalPrice: { $sum: "$productData.price" }
        }
      }
    ]);

    const revenue = totalPriceAgg[0]?.totalPrice || 0;

    // 4. Final natija
    const result = {
      pending: 0,
      delivered: 0,
      processing: 0,
      shipped: 0,
      revenue,
      total,
    };

    counts.forEach(item => {
      result[item._id] = item.count;
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('Statistikani olishda xatolik:', err);
    res.status(500).json({ error: 'Serverda xatolik' });
  }
}



async function receiveProduct(req,res) {
   try {
    const { productId, quantity, unitPrice, status } = req.body;

    const newEntry = new sellerModel({
      productId: productId || 'Product',
      count: quantity,
      price: unitPrice,
      status: status || 'consumption',
    });

    await newEntry.save();

    res.status(201).json({ message: 'Ma’lumot saqlandi', data: newEntry });
  } catch (error) {
    console.error('Xatolik:', error);
    res.status(500).json({ message: 'Ichki server xatosi', error: error.message });
  }
}



module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  allStatistic,
  getStats,
  receiveProduct
};
