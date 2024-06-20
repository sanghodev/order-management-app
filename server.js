const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const next = require('next');
const Order = require('./models/Order'); // Assuming you have an Order model defined in models/Order

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI; // 환경 변수로 설정

app.prepare().then(() => {
  const server = express();
  const httpServer = http.createServer(server);
  const io = socketIo(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  server.use(express.json());

  // Connect to MongoDB
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

  // Socket.io connection
  io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  // Get all orders or filter by status
  server.get('/api/orders', async (req, res) => {
    try {
      const { status } = req.query;
      const query = status ? { status } : {};
      const orders = await Order.find(query);
      res.json({ data: orders });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Create new order
  server.post('/api/orders', async (req, res) => {
    try {
      const order = new Order(req.body);
      await order.save();
      io.emit('orderUpdated', order);
      res.json({ data: order });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // Update order status
  server.put('/api/orders/:id', async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
      io.emit('orderUpdated', order);
      res.json({ data: order });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update order' });
    }
  });

  // Complete order
  server.put('/api/orders/:id/complete', async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(req.params.id, { status: 'Complete' }, { new: true });
      io.emit('orderUpdated', order);
      res.json({ data: order });
    } catch (err) {
      res.status(500).json({ error: 'Failed to complete order' });
    }
  });

  // Rollback order status
  server.put('/api/orders/:id/rollback', async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(req.params.id, { status: 'Pending' }, { new: true });
      io.emit('orderUpdated', order);
      res.json({ data: order });
    } catch (err) {
      res.status(500).json({ error: 'Failed to rollback order' });
    }
  });

  // Delete order
  server.delete('/api/orders/:id', async (req, res) => {
    try {
      await Order.findByIdAndDelete(req.params.id);
      io.emit('orderDeleted', req.params.id);
      res.json({ message: 'Order deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete order' });
    }
  });

  // Handle all other routes with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Start the server
  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server running on port ${PORT}`);
  });
});
