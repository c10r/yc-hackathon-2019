// A reference to Stripe.js
var stripe;

const GLOBAL_STATE = {
  isLoggedIn: false,
  showSignIn: false,
  currentUrl: '',
  username: '',
}

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

const URL_BASE = `https://us-central1-credz-io.cloudfunctions.net/`

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
});

chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    GLOBAL_STATE.currentUrl = tabs[0].url

    const titleElement = document.querySelector("#page-title")

    const TWEET_MATCH = /https:\/\/twitter.com\/(.*)\/status\/.*/
    if (GLOBAL_STATE.currentUrl.match(TWEET_MATCH) !== null) {
      const userName = GLOBAL_STATE.currentUrl.match(TWEET_MATCH)[1]
      titleElement.textContent = `${userName}'s Tweet`
    } else {
      titleElement.textContent = tabs[0].title
    }
})

document.querySelector("#amount").addEventListener("input", function(evt) {
    evt.preventDefault();
    amount_field = document.querySelector("#amount");
    
    val = amount_field.value;
    splits = val.split(".");

    if (splits.length > 1) {
        decimal = splits[1];
        if (decimal.length > 2) {
            decimal = decimal.slice(0, 1) + decimal.charAt(decimal.length-1);
            val = splits[0] + "." + decimal;
        }
    }

    amount_field.value = val;
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
  var result = await stripe
    .createPaymentMethod({
        type: 'card',
        card: card,
    })


    if (result.error) {
        changeLoadingState(false);
        let errorMsg = document.querySelector(".sr-field-error");
        errorMsg.textContent = result.error.message;
        setTimeout(function() {
          errorMsg.textContent = "";
        }, 4000);
        return
    }

    const payment_method = result.paymentMethod.id;
    const message = document.getElementById('message').value
    
    var result = await fetch(`${URL_BASE}/charge`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({
                amount: amount*100,
                payment_method,
                url: GLOBAL_STATE.currentUrl,
                username: GLOBAL_STATE.isLoggedIn ? GLOBAL_STATE.username : '',
                message,
            })
    })

    changeLoadingState(false);
    if (result.error) {
        var errorMsg = document.querySelector(".sr-field-error");
        errorMsg.textContent = result.error.message;
        setTimeout(function() {
          errorMsg.textContent = "";
        }, 4000);
        return
    } else {
        orderComplete();
    }
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
const orderComplete = function() {
  document.querySelectorAll(".payment-view").forEach(function(view) {
      view.classList.add("hidden");
  });
  document.querySelectorAll(".completed-view").forEach(function(view) {
      view.classList.remove("hidden");
  });

  document.body.height = '300px';
}

document.getElementById('close-sign-in-form').addEventListener('click', function() {
  GLOBAL_STATE.showSignIn = false
  changeShowSignIn(false)
})

document.getElementById('signin-link').addEventListener('click', function() {
  GLOBAL_STATE.showSignIn = true
  changeShowSignIn(true)
})

document.getElementById('login-submit').addEventListener('click', async function() {
  const username = document.getElementById('login-username').value
  const password = document.getElementById('login-password').value

  const errorMsg = document.getElementById("login-error")
  if (!username) {
    errorMsg.textContent = "Please enter a valid username."
  }

  if (!password && username) {
    errorMsg.textContent = "Please enter a valid password."
  }

  if (!username || !password) {
    setTimeout(function() {
      errorMsg.textContent = "";
    }, 4000);

    return
  }

  try {
    await fetch(`${URL_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        username,
        password,
      })
    })
  } catch (error) {
    console.error(`Could not log in: ${error}`)
    GLOBAL_STATE.isLoggedIn = false
    return
  }

  GLOBAL_STATE.isLoggedIn = true
  changeLoggedInState(GLOBAL_STATE.isLoggedIn)
})

// // Show a spinner on payment submission
const changeLoadingState = function(isLoading) {
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

const changeShowSignIn = function(showSignIn) {
  const donationPage = document.getElementById('donation-page')
  const loginPage = document.getElementById('sign-in-form')
  if (showSignIn) {
    donationPage.style.display = "none"
    loginPage.style.display = "block"
  } else {
    donationPage.style.display = "block"
    loginPage.style.display = "none"
  }
}

const changeLoggedInState = function(isLoggedIn) {
  // Render changes in the html based on login state
}

changeShowSignIn(GLOBAL_STATE.showSignIn)