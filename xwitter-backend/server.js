const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const webpush = require('web-push');

const publicPushKey = 'BOfw9J3SFmHtIm_eyL7W4jSZsEeFEn1hLQnTYHKoXqrDdvcOed3v9QGQQjk35n0D-XOLv0WFLv8wvt4EUMe0fIQ';
const privatePushKey = 'GvF-CA9rdcsuCbXZimQNZMJR4SD85pUvoCp8qTvcRyc';

// Pré-configurer webpush avec nos clés
webpush.setVapidDetails('mailto:anthopark0021@gmail.com', publicPushKey, privatePushKey);
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

const Subscription = mongoose.model('Subscription', {
    endpoint: String,
    keys: {
        p256dh: String,
        auth: String
    }
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

        const rows = await Subscription.find();
        console.log('Sending notifications to: ', rows);
        for (const subscription of rows) {
            const serializedSubscription = JSON.stringify(subscription);
            // Notification = titre: nouveau post de 'name', corps: 'message'
            const notification = JSON.stringify({ title: 'Nouveau post de ' + name, body: message });
            console.log('Sending notification to: ', serializedSubscription);
            console.log('Notification: ', notification);
            try {
                await webpush.sendNotification(serializedSubscription, notification);
            } catch (notificationError) {
                if (notificationError.statusCode === 410 || notificationError.statusCode === 404) {
                    // Supprimer l'abonnement de la base de données
                    console.error('Subscription is no longer valid: ', notificationError.statusCode);
                    await Subscription.deleteOne({ _id: subscription._id }).exec();
                }
            }
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Enregistrement des abonnements
app.post('/subscriptions', async (req, res) => {
    try {
        const newSubscription = new Subscription(req.body);
        await newSubscription.save();
        res.json({ message: 'Subscription added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/subscriptions', async (req, res) => {
    try {
        const subscriptions = await Subscription.find();
        res.json(subscriptions);
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
