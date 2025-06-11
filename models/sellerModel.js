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
    productId: { type: String},
    count: { type: Number, required: true},
    price:{ type: Number, required: true},
    data: { type: Date, default: Date.now},
    status: {type:String},
    userId: {type:String}
  },
);

module.exports = mongoose.model('sellerModel', UserSchema);
