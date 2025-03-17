const app = Vue.createApp({
    data() {
        return {
            cart: [],  // Indeholder de produkter, der er i kurven
            payment: {
                cardNumber: '',
                expiryDate: '',
                cvv: ''
            }
        };
    },
    computed: {
        totalPrice() {
            return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
        }
    },
    methods: {
        // Håndter betaling
        handlePayment() {
            // Før du udfører betalingen, skal du validere kortoplysningerne.
            if (this.validatePaymentDetails()) {
                // Send betalingsanmodning til din backend
                axios.post('/api/payment', {
                    cart: this.cart,
                    paymentDetails: this.payment
                })
                .then(response => {
                    // Hvis betalingen var vellykket, vis takkeside eller besked
                    alert("Betaling gennemført succesfuldt!");
                    window.location.href = 'thank-you.html';  // Redirect til takkeside
                })
                .catch(error => {
                    console.error("Fejl under betaling:", error);
                    alert("Betaling mislykkedes. Prøv venligst igen.");
                });
            }
        },

        // Valider betalingsoplysninger
        validatePaymentDetails() {
            if (!this.payment.cardNumber || !this.payment.expiryDate || !this.payment.cvv) {
                alert("Venligst udfyld alle betalingsoplysninger.");
                return false;
            }
            // Tilføj mere validering af kortnumre, udløbsdato, etc.
            return true;
        }
    },
    mounted() {
        // Hent kurvdata fra localStorage eller API
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
    }
});

app.mount('#checkout-app');
