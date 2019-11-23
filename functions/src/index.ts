import * as functions from 'firebase-functions'
const admin = require('firebase-admin')
const stripe = require("stripe")("sk_test_XjjFP41NzYWM5KfH2MZzDnkU0075LBgZ2G")


admin.initializeApp(functions.config().firebase)
let db = admin.firestore()

function getSum(total: any, num: any) {
  return total + Math.round(num);
}

export const trending = functions.https.onRequest(async (req, res) => {
  try {
    const donations = await db.collection('donations').get();

    var urlDonationTotal:any = {}

    donations.forEach((doc: any) => {
      const data = doc.data();

      if (!(data.url in urlDonationTotal)) {
        urlDonationTotal[data.url] = {
          url: data.url,
          amount: 0.0,
          owner: doc.owner,
        }
      }

      urlDonationTotal[data.url].amount += data.amount;
    });

    var urlList:any = [];

    for (var key in urlDonationTotal) {
      urlList.push(urlDonationTotal[key])
    }

    urlList.sort((a:any, b:any) => (a.amount > b.amount) ? -1 : 1)

    res.status(200).json(urlList);
  } catch (error) {
    console.log('error getting latest donations: ' + error);
    res.status(500).send('error getting latest donations');
    return
  }
});

export const calculateDonations = functions.https.onRequest(async (req, res) => {
  const { url } = req.body

  const querySnapshot = await db
    .collection('donations')
    .where('url', '==', url)
    .get()

  const amounts = querySnapshot.docs.map((doc: any) => doc.data().amount)
  const sum = amounts.reduce(getSum, 0)
  return res.status(200).json({sum: sum})
});

export const charge = functions.https.onRequest(async (req, res) => {
  const currency = 'USD'
  const { amount, payment_method, url, username, message, customer_id } = req.body

  const trimmedUrl = url.replace(/\/$/, "");

  const querySnapshot = await db
    .collection('urls')
    .where('url', '==', trimmedUrl)
    .get()

  let transfer_data
  if (!querySnapshot.empty) {
    const data = querySnapshot.docs[0].data()
    transfer_data = {
      amount: Math.round(amount * 0.85),
      destination: data.stripe_account,
    }
  }

  try {
    if (username != '' && customer_id != '') {
      await stripe.paymentMethods.attach(payment_method, { customer: customer_id })
    }
  } catch (error) {
    console.error(`Could not save Stripe customer payment method: ${error}`)
  }

  // Create a PaymentIntent with the order amount and currency
  let paymentIntent
  try {
    var request:any = {
      amount,
      currency,
      payment_method,
      confirm: true,
      metadata: {
        'url': trimmedUrl,
        'message': message,
      }
    }

    if (customer_id) {
      request.customer = customer_id == '' ? null : customer_id
    }

    if (transfer_data) {
      request.transfer_data = transfer_data
    }

    paymentIntent = await stripe.paymentIntents.create(request)
  } catch (error) {
    console.error(`Error creating payment intent: ${error}`)
    res.status(500).send('Invalid payment intent creation')
    return
  }

  await db.collection('donations').doc().set({
    amount,
    trimmedUrl,
    username,
    message,
    ts: new Date(),
    payment_intent: paymentIntent.id,
  })

  // Send publishable key and PaymentIntent details to client
  res.status(200).json({})
});

export const login = functions.https.onRequest(async (req, res) => {
  const { username, password } = req.body
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
      return
    }

    const userRecord = querySnapshot.docs[0].data();

    if (userRecord.password === password) {
      // Login successful.
      res.status(200).send(userRecord);
    } else {
      res.status(500).send('Invalid username/password');
    }
  } catch(error) {
    // Handle Errors here.
    console.error(`Error signing in user: ${error}`)
    res.status(500).send('Error signing in user')
    return
  }
});