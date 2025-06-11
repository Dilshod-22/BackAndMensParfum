// models/User.js
const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productname: { type: String, required: true },
    price: { type: Number, required: true },
    main_image: { type: String, default: null },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    role: { type: String, default: 'user' },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    phone_number: { type: String, default: null },
    profile_image_url: { type: String, default: null },
    address: { type: String, default: null },
    preferred_language: { type: String, default: 'uz' },
    birth_date: { type: Date, default: null },
    is_active: { type: Boolean, default: true },
    shoppingcart: { type: [CartItemSchema], default: [] },
  },
  {
    collection: 'users',
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);
