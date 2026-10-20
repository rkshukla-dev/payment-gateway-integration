import express from "express";
import Razorpay from "razorpay";
import bodyParser from "body-parser";
import path from 'path';
import fs, { stat } from 'fs';
import { fileURLToPath } from 'url';
import { validatePaymentVerification  } from "razorpay/dist/utils/razorpay-utils.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

const razorpay = new Razorpay({
    key_id: "rzp_test_Tq8vXSCR1juB1a",
    key_secret: "6R5MYbUlIH0CarvofJZKzNib"
})

// Function to read data from JSON file
const readData = () => {
    if(fs.existsSync('orders.json')) {
        const data = fs.readFileSync('orders.json');
        return JSON.parse(data);
    }
    return [];
}

// Function to write data to JSON file
const writeData = (data) => {
    fs.writeFileSync('orders.json', JSON.stringify(data, null, 2))
}

// Initialize order.json if it doesn't exist
if(!fs.existsSync('orders.json')) {
    writeData([]);
}

app.post('/create-order', async (req, res) => {
    try {
        const { amount, currency, receipt, notes } = req.body;
        const options = {
            amount: amount * 100,   // Convert amount to paise
            currency,
            receipt,
            notes,
        };

        const order = await razorpay.orders.create(options);

        // Read current orders, add new order, and write back to the file
        const orders = readData();
        orders.push({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            status: 'created',
        });
        writeData(orders);
        
        res.json(order);    // send order details to frontend, including order ID
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating order');
    }
});

// Route to serve the success page
app.get('/payment-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
});

app.post('/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = razorpay.key_secret;
    try {
        const isValidSignature = validatePaymentVerification (
            {
                order_id: razorpay_order_id,
                payment_id: razorpay_payment_id
            },
            razorpay_signature, secret);
        if(isValidSignature) {
            // Update the order with payment details
            const orders = readData();
            const order = orders.find(o => o.order_id === razorpay_order_id);
            if(order) {
                order.status = 'paid';
                order.payment_id = razorpay_payment_id;
                writeData(orders);
            }
            res.status(200).json({ status: 'ok' });
            console.log("Payment verification successful")
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error verifying payment' })
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});