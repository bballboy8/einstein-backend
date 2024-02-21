var express = require("express");
const stripe = require("stripe")("sk_test_51OeLf7CqP6v2blZgQwQW2HQtJbNOcCL4hJV5XIHOEZ8kEEpUlIWH1S3D2aXQsGXj3Q5j4allzWrGadKV0iD4816W00fgd131p6")
const bodyParser = require('body-parser');
var router = express.Router();
const StripeController = require("../../controllers/Stripe.controller")
const users = require("../../models/User")


router.post('/webhook', bodyParser.raw({type: 'application/json'}), async(req, res) => {
  console.log('start stripe webhook')
  const event = req.body;
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      if(paymentIntent.status =="succeeded")
      {
        const customer = await stripe.customers.retrieve(paymentIntent.customer);
        console.log(customer.email, paymentIntent.amount)
        let user = await users.findOne({ email: customer.email });
        let add_price = user.price + (paymentIntent.amount / 100)
        let update_price = await users.findOneAndUpdate(
          { email: customer.email},
          { $set: {price: add_price} }
        )
        await update_price.save()
      }
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
})

module.exports = router;