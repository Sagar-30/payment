const express = require('express');
const stripe = require('stripe')('sk_test_51QWZV1CHL6qdDwdCQRlkS1o04lvTdGcY8brzeRAqXI9rzflEH9pFXtFhGqx8JLbstdxFS9SjkgaOjtI4szYxTKBQ00vQPNDZdf');
const { body, validationResult } = require('express-validator');


const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

//To keep awake
app.get('/ping', (req, res) => {
  res.send('Awake');
});

// Stripe checkout endpoint
app.post('/create-checkout-session', [
  body('product').exists().withMessage('Product data is required'),
  body('product.name').notEmpty().withMessage('Product name is required'),
  body('product.price').isNumeric().withMessage('Price must be a number')
], async (req, res) => {
  try {
    console.log("Received checkout request:", {
      product: req.body.product,
      timestamp: new Date().toISOString()
    });

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { name, price, id, img, description } = req.body.product;
    
    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Product name and price are required'
      });
    }

    // Validate price
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ 
        error: 'Invalid price',
        details: 'Price must be a positive number'
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: name,
              description: description || `Bike rental - ID: ${id}`,
              images: img ? [img] : [],
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://blog.lipsumhub.com/what-is-dummy-page/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://blog.lipsumhub.com/what-is-dummy-page/?canceled=true`,
      metadata: {
        product_id: id.toString(),
        product_name: name
      }
    });

    console.log(`Checkout session created successfully: ${session.id}`);
    
    res.json({ 
      id: session.id,
      url: session.url 
    });
    
  } catch (error) {
    console.error('Error creating checkout session:', {
      message: error.message,
      type: error.type,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Specific error handling for Stripe errors
    if (error.type === 'StripeCardError') {
      res.status(400).json({ 
        error: 'Payment failed',
        message: error.message 
      });
    } else if (error.type === 'StripeInvalidRequestError') {
      res.status(400).json({ 
        error: 'Invalid request',
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Unable to process payment at this time'
      });
    }
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});


app.listen(4242, () => {
  console.log(`Server is running on http://localhost:4242`);
});

