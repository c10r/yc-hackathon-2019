"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require('firebase-admin');
const stripe = require("stripe")("sk_test_XjjFP41NzYWM5KfH2MZzDnkU0075LBgZ2G");
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
exports.calculateDonations = functions.https.onRequest(async (req, res) => {
    const { url } = req.body;
    const querySnapshot = await db
        .collection('donations')
        .where('url', '==', url)
        .get();
    const data = querySnapshot.docs.map((doc) => doc.data());
    return res.status(200).json(data);
});
exports.charge = functions.https.onRequest(async (req, res) => {
    const currency = 'USD';
    const { amount, payment_method, url, username, message, customer_id } = req.body;
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
            customer: customer_id == '' ? null : customer_id,
        });
    }
    catch (error) {
        console.error(`Error creating payment intent: ${error}`);
        res.status(500).send('Invalid payment intent creation');
        return;
    }
    try {
        if (username != '' && customer_id != '') {
            await stripe.paymentMethods.attach(payment_method, { customer: customer_id });
        }
    }
    catch (error) {
        console.error(`Could not save Stripe customer payment method: ${error}`);
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
exports.login = functions.https.onRequest(async (req, res) => {
    const { username, password } = req.body;
    try {
        const querySnapshot = await db.collection('users')
            .where("username", "==", username)
            .get();
        if (querySnapshot.empty) {
            const stripeCust = await stripe.customers.create({});
            let docRef = db.collection('users').doc();
            const user = {
                username,
                password,
                stripe_customer: stripeCust.id,
            };
            docRef.set(user);
            res.status(200).send(user);
            return;
        }
        const userRecord = querySnapshot.docs[0].data();
        if (userRecord.password === password) {
            // Login successful.
            res.status(200).send(userRecord);
        }
        else {
            res.status(500).send('Invalid username/password');
        }
    }
    catch (error) {
        // Handle Errors here.
        console.error(`Error signing in user: ${error}`);
        res.status(500).send('Error signing in user');
        return;
    }
});
//# sourceMappingURL=index.js.map