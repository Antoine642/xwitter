const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Server is running on ' + PORT);
// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Configuration
mongoose.connect('mongodb://localhost:27017/xwitter', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Models
const Message = mongoose.model('Message', {
    name: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

// Routes
app.get('/messages', async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/messages', async (req, res) => {
    try {
        const { name, message } = req.body;
        const newMessage = new Message({ name, message });
        await newMessage.save();
        res.json({ message: 'Message added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Middleware pour gérer les erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
