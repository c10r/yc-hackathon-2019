"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
// Copy the .env.example in the root into a .env file in this folder
const stripe = require("stripe")("sk_test_XjjFP41NzYWM5KfH2MZzDnkU0075LBgZ2G");
const calculateOrderAmount = () => {
    // Replace this constant with a calculation of the order's amount
    // Calculate the order total on the server to prevent
    // people from directly manipulating the amount on the client
    return 100;
};
exports.createPaymentIntent = functions.https.onRequest(async (req, res) => {
    const currency = 'USD';
    // Required if we want to transfer part of the payment as a donation
    // A transfer group is a unique ID that lets you associate transfers with the original payment
    const transferGroup = `group_${Math.floor(Math.random() * 10)}`;
    // Create a PaymentIntent with the order amount and currency
    let paymentIntent;
    try {
        paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(),
            currency: currency,
            transfer_group: transferGroup
        });
    }
    catch (error) {
        console.error(`Error creating payment intent: ${error}`);
        res.status(500).send('Womp Womp');
        return;
    }
    // Send publishable key and PaymentIntent details to client
    res.send({
        publicKey: "pk_test_wPYxwhf0vo7zVw1CIHaAzOkl00gZEQBhgx",
        paymentIntent: paymentIntent
    });
});
exports.updatePaymentIntent = functions.https.onRequest(async (req, res) => {
    const { isDonating, id } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    let metadata;
    if (isDonating) {
        // Add metadata to track the amount being donated
        metadata = Object.assign(paymentIntent.metadata || {}, {
            donationAmount: 46,
            organizationAccountId: process.env.ORGANIZATION_ACCOUNT_ID
        });
    }
    else {
        metadata = Object.assign(paymentIntent.metadata || {}, {
            donationAmount: null,
            organizationAccountId: null
        });
    }
    // Update the PaymentIntent with the new amount and metedata
    const updatedPaymentIntent = await stripe.paymentIntents.update(id, {
        amount: calculateOrderAmount(),
        metadata: metadata
    });
    res.send({ amount: updatedPaymentIntent.amount });
});
//# sourceMappingURL=index.js.map