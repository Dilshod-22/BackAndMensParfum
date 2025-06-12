// models/Order.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    count: { type: Number, required: true },
    price:{type:Number}
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    create_date: { type: Date, default: Date.now },
    items: { type: [OrderItemSchema], required: true, default: [] },
    status: { type: String },           // masalan: 0,1,2 kabi
    client_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    address: { type: String, default: '' },
  },
  {
    collection: 'orders',
    timestamps: false,
  }
);

module.exports = mongoose.model('Order', OrderSchema);
