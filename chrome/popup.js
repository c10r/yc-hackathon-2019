// A reference to Stripe.js
var stripe;

// fetch("/create-payment-intent", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json"
//   },
//   body: JSON.stringify(getPaymentIntentData())
// })
//   .then(function(result) {
//     return result.json();
//   })
//   .then(function(data) {
//     return setupElements(data);
//   });
//   .then(function(stripeData) {
//     document.querySelector("#submit").addEventListener("click", function(evt) {
//       evt.preventDefault();
//       // Initiate payment
//       pay(stripeData.stripe, stripeData.card, stripeData.clientSecret);
//     });

//     document
//       .querySelector('input[type="checkbox"]')
//       .addEventListener("change", function(evt) {
//         handleCheckboxEvent(stripeData.id, evt.target.checked);
//       });
//   });

// Set up Stripe.js and Elements to use in checkout form
var setupElements = function() {
  stripe = Stripe('pk_test_wPYxwhf0vo7zVw1CIHaAzOkl00gZEQBhgx');
  //console.log("data", data);
  var elements = stripe.elements();
  var style = {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4"
      }
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a"
    }
  };

  var card = elements.create("card", { style: style });
  card.mount("#card-element");

  return {
    stripe,
    card
  };
};

new Promise((resolve, reject) => {
    resolve(setupElements());
})
.then(function(stripeData) {
    document.querySelector("#submit").addEventListener("click", function(evt) {
        evt.preventDefault();
        // Initiate payment
        pay(stripeData.stripe, stripeData.card);
    });
})

chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    document.querySelector("#page-title").textContent =  'Credit ' + tabs[0].title;
});

/*
 * Calls stripe.confirmCardPayment which creates a pop-up modal to
 * prompt the user to enter  extra authentication details without leaving your page
 */
var pay = async function(stripe, card) {
  changeLoadingState(true);

  amount = document.querySelector("#amount").value;

  // Initiate the payment.
  // If authentication is required, confirmCardPayment will display a modal
  const result = await stripe
    .createPaymentMethod({
        type: 'card',
        card: card,
    })


    if (result.error) {
        changeLoadingState(false);
        var errorMsg = document.querySelector(".sr-field-error");
        errorMsg.textContent = result.error.message;
        setTimeout(function() {
          errorMsg.textContent = "";
        }, 4000);
        return
    }

    const payment_method = result.paymentMethod.id;
    
    fetch("https://us-central1-credz-io.cloudfunctions.net/charge", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                amount: amount*100,
                payment_method
            })
    })
};

// var handleCheckboxEvent = function(id, isDonating) {
//   changeLoadingState(true);

//   const orderData = {
//     isDonating: isDonating,
//     email: document.getElementById("email").value,
//     id: id
//   };
//   fetch("/update-payment-intent", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify(orderData)
//   })
//     .then(function(response) {
//       return response.json();
//     })
//     .then(function(data) {
//       changeLoadingState(false);
//       updateTotal(data.amount);
//     });
// };

// /* ------- Post-payment helpers ------- */

// /* Shows a success / error message when the payment is complete */
// var orderComplete = function(clientSecret) {
//   stripe.retrievePaymentIntent(clientSecret).then(function(result) {
//     var paymentIntent = result.paymentIntent;
//     var paymentIntentJson = JSON.stringify(paymentIntent, null, 2);
//     document.querySelectorAll(".payment-view").forEach(function(view) {
//       view.classList.add("hidden");
//     });
//     document.querySelectorAll(".completed-view").forEach(function(view) {
//       view.classList.remove("hidden");
//     });
//     document.querySelector("pre").textContent = paymentIntentJson;
//   });
// };

// // Show a spinner on payment submission
var changeLoadingState = function(isLoading) {
  if (isLoading) {
    document.querySelector("button").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("button").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
};

// var updateTotal = function(newAmount) {
//   document.querySelector(".order-amount").textContent =
//     "$" + (newAmount / 100).toFixed(2);
//   if (newAmount === 1400) {
//     document.querySelector(".donation-text").classList.remove("hidden");
//   } else {
//     document.querySelector(".donation-text").classList.add("hidden");
//   }
// };