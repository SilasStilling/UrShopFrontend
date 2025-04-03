const stripe = require('stripe')('sk_test'); // I må fucking ik skrive den string public her!
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/payment', async (req, res) => {
    const { cart, paymentDetails } = req.body;

    // Beregn totalbeløbet for ordren
    const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0) * 100;  // Beløb i cent

    try {
        // Opret en betaling
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount,
            currency: 'dkk',
            payment_method_data: {
                type: 'card',
                card: {
                    number: paymentDetails.cardNumber,
                    exp_month: paymentDetails.expiryDate.split('/')[0],
                    exp_year: paymentDetails.expiryDate.split('/')[1],
                    cvc: paymentDetails.cvv
                }
            },
            confirmation_method: 'automatic',
            confirm: true
        });

        res.status(200).send({ success: true, message: 'Payment successful!' });
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).send({ success: false, message: 'Payment failed. Try again later.' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));