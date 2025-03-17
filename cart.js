Vue.createApp({
    data() {
        return {
            cart: []
        };
    },
    computed: {
        totalPrice() {
            return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
        }
    },
    created() {
        this.loadCart();
    },
    methods: {
        loadCart() {
            const savedCart = localStorage.getItem("cart");
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
        },
        saveCart() {
            localStorage.setItem("cart", JSON.stringify(this.cart));
        },
        increaseQuantity(item) {
            item.quantity++;
            this.saveCart();
        },
        decreaseQuantity(item) {
            if (item.quantity > 1) {
                item.quantity--;
            } else {
                this.removeFromCart(item.id);
            }
            this.saveCart();
        },
        removeFromCart(productId) {
            this.cart = this.cart.filter(item => item.id !== productId);
            this.saveCart();
        },
        clearCart() {
            this.cart = [];
            localStorage.removeItem("cart");
        }
    }
}).mount('#cart-app');
