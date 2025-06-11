// models/Product.js
const mongoose = require('mongoose');

const ProductImageSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },       // 'main' yoki 'thumbnail'
    imageLink: { type: String, required: true },     // ImageKit URL
  },
  { _id: false }
);

const ExtraInfoSchema = new mongoose.Schema(
  {
    // Agar extrainfo schema oldindan belgilanmagan bo‘lsa,
    // uni `Mixed` qilib qo‘yish imkoniyati bor:
    // Agar siz loyihada aniq struktura bo‘lsa, shu yerga kiritishingiz mumkin.
  },
  { strict: false }
);

const ProductSchema = new mongoose.Schema(
  {
    productname: { type: String, required: true },
    brand: { type: String, default: null },
    count: { type: Number, default: 0 },
    sku: { type: String, default: null },
    ratingproduct: { type: Number, default: 0 },
    price: { type: Number, required: true },
    category: { type: String, default: '' },
    extrainfo: { type: ExtraInfoSchema, default: {} },
    productimage: { type: [ProductImageSchema], default: [] },
    datacreate: { type: Date, default: Date.now },
  },
  {
    collection: 'products', // MongoDB kolleksiya nomi
    timestamps: false,
  }
);

module.exports = mongoose.model('Product', ProductSchema);
