const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  salesRep: { type: String, required: true },
  customerAccount: { type: String, required: true },
  designProof: { type: Boolean, default: false },
  silkprintFilm: { type: Boolean, default: false },
  embroidery: { type: Boolean, default: false },
  decal: { type: Number, default: 0 },
  dtf: { type: Number, default: 0 },
  medal: { type: Number, default: 0 },
  trophy: { type: Number, default: 0 },
  pickupDate: { type: String, required: true },
  notes: { type: String, default: '' },
  status: { type: String, default: 'Pending' },
});

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
