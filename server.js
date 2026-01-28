require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

// Chhobi rakhar folder auto create hobe
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir); }
app.use('/uploads', express.static('uploads'));

// MongoDB Atlas Connection
const mongoURI = "mongodb+srv://decotechadmin:DecoTech123@cluster0.vudlgre.mongodb.net/DecoTechDB?retryWrites=true&w=majority";
mongoose.connect(mongoURI).then(() => console.log("Database Connected! ✅"));

// Product Schema
const Product = mongoose.model('Product', {
    name: String, price: Number, image: String, category: String
});

// Multer Storage
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// API: Get Products
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

// API: Add Product (Combined logic for URL and File)
app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        let finalImagePath = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : req.body.imageURL;
        const newProduct = new Product({
            name: req.body.name,
            category: req.body.category,
            price: req.body.price,
            image: finalImagePath
        });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: "Failed to add product" });
    }
});

app.listen(5000, () => console.log("Server running on port 5000 🚀"));

// Order Schema
const Order = mongoose.model('Order', {
    customerName: String,
    phone: String,
    address: String,
    products: Array,
    totalAmount: Number,
    date: { type: Date, default: Date.now }
});

// API: Save Order
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ success: true, message: "Order saved to database!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Database theke shob orders dekhano
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 }); // Notun order upore thakbe
        res.json(orders);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Order delete korar route
app.delete('/api/orders/:id', async (req, res) => {
    await Order.findByIdAndDelete(req.params.id);
    res.send({ message: "Order Deleted" });

});
