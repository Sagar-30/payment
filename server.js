const express = require('express');
const stripe = require('stripe')('sk_test_51QWZV1CHL6qdDwdCQRlkS1o04lvTdGcY8brzeRAqXI9rzflEH9pFXtFhGqx8JLbstdxFS9SjkgaOjtI4szYxTKBQ00vQPNDZdf');


const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  try {
    console.log("Received product data:", req.body.product);
    const { title, price, id, img, description, kmDriven } = req.body.product;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: title, // Use title as the product name
              description: description, // Add the description to show on the checkout page (optional)
            },
            unit_amount: price * 100, // Stripe works with cents, so multiply by 100
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://blog.lipsumhub.com/what-is-dummy-page/`,
      cancel_url: `https://blog.lipsumhub.com/what-is-dummy-page/`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error occurred while creating checkout session:', error);
    res.status(500).send(error.message);
  }
});

// Server listens on port 4242
const port = 4242;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
