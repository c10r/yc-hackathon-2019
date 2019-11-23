"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require('firebase-admin');
const stripe = require("stripe")("sk_test_XjjFP41NzYWM5KfH2MZzDnkU0075LBgZ2G");
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
exports.calculateDonations = functions.https.onRequest(async (req, res) => {
    const { url } = req.body;
    console.log(`req.body: ${Object.keys(req.body)}`);
    console.log(`url: ${url}`);
    const docs = await db
        .collection('donations')
        .where('url', '==', url)
        .get();
    const data = docs.map((doc) => doc.data());
    return res.status(200).json(data);
});
exports.charge = functions.https.onRequest(async (req, res) => {
    const currency = 'USD';
    const { amount, payment_method, url, username, message } = req.body;
    // Required if we want to transfer part of the payment as a donation
    // A transfer group is a unique ID that lets you associate transfers with the original payment
    const transfer_group = `group_${Math.floor(Math.random() * 10)}`;
    // Create a PaymentIntent with the order amount and currency
    let paymentIntent;
    try {
        paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            transfer_group,
            payment_method,
            confirm: true,
        });
    }
    catch (error) {
        console.error(`Error creating payment intent: ${error}`);
        res.status(500).send('Invalid payment intent creation');
        return;
    }
    await db.collection('donations').doc().set({
        amount,
        url,
        username,
        message,
        ts: new Date(),
        payment_intent: paymentIntent.id,
    });
    // Send publishable key and PaymentIntent details to client
    res.status(200).json({});
});
//# sourceMappingURL=index.js.map