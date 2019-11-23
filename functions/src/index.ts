import * as functions from 'firebase-functions';
const admin = require('firebase-admin');

// Copy the .env.example in the root into a .env file in this folder
const stripe = require("stripe")("sk_test_XjjFP41NzYWM5KfH2MZzDnkU0075LBgZ2G")

export const charge = functions.https.onRequest(async (req, res) => {
  const currency = 'USD'
  const { amount, payment_method } = req.body

  // Required if we want to transfer part of the payment as a donation
  // A transfer group is a unique ID that lets you associate transfers with the original payment
  const transfer_group = `group_${Math.floor(Math.random() * 10)}`

  // Create a PaymentIntent with the order amount and currency
  let paymentIntent
  try {
    paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        transfer_group,
        payment_method,
        confirm: true,
    })
  } catch (error) {
      console.error(`Error creating payment intent: ${error}`)
      res.status(500).send('Invalid payment intent creation')
      return
  }

  console.log(`Created payment intent ${paymentIntent.id}`)

  try {
    await stripe.paymentIntents.capture(paymentIntent.id)
  } catch (error) {
    console.error(`Could not capture payment intent: ${paymentIntent.id}: ${error}`)
    res.status(500).send(`Unable to capture payment intent: ${paymentIntent.id}`)
    return
  }

  // Send publishable key and PaymentIntent details to client
  res.status(200).send({})
})

// export const updatePaymentIntent = functions.https.onRequest(async (req, res) => {
//   const { isDonating, id } = req.body
//   const paymentIntent = await stripe.paymentIntents.retrieve(id)
// 
//   let metadata
// 
//   if (isDonating) {
//     // Add metadata to track the amount being donated
//     metadata = Object.assign(paymentIntent.metadata || {}, {
//       donationAmount: 46,
//       organizationAccountId: process.env.ORGANIZATION_ACCOUNT_ID
//     })
//   } else {
//     metadata = Object.assign(paymentIntent.metadata || {}, {
//       donationAmount: null,
//       organizationAccountId: null
//     })
//   }
// 
//   // Update the PaymentIntent with the new amount and metedata
//   const updatedPaymentIntent = await stripe.paymentIntents.update(id, {
//     amount: calculateOrderAmount(),
//     metadata: metadata
//   })
// 
//   res.send({ amount: updatedPaymentIntent.amount })
// })

admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

export const donate = functions.https.onRequest(async (req, res) => {
  let docRef = db.collection('donations').doc();

  docRef.set({
    url: 'test_url',
    donation_amount: 0.30,
  });
})