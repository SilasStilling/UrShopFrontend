const ApiUrl = 'https://localhost:7214/api/Products';
const AuthUrl = 'https://localhost:7214/api/Users/login';
const RegisterUrl = 'https://localhost:7214/api/Users';

Vue.createApp({
    data() {
        return {
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
            passwordChangeMessage: '',
            passwordChangeError: '',
            products: [],
            selectedFile: null,
            idToGetById: 0,
            showRegister: false,
            showChangePassword: false,
            showCartDropdown: false,
            singleProduct: null,
            cart: JSON.parse(localStorage.getItem("cart")) || [],
            deleteId: 0,
            newUser: {
                username: '',
                email: '',
                password: '',
                role: ''
            },
            registerMessage: '',
            deleteMessage: "",
            uploadMessage: "",
            loginMessage: "",
            product: Vue.reactive({
                name: "",
                model: "",
                price: 0,
                imageData: ""
            }),
            user: {
                username: "",
                password: ""
            },
            token: localStorage.getItem("token") || "",
            showLogin: false,
            isLoggedIn: false,
            isAdmin: false,
            isLockedOut: false,
            remainingTime: 0,
            payment: {
                cardNumber: '',
                expiryDate: '',
                cvv: ''
            }
        };
    },
    created() {
        this.getAllProducts();
        this.checkToken();
        this.loadCart();
        window.addEventListener('storage', this.loadCart);
    },
    beforeUnmount() {
        window.removeEventListener('storage', this.loadCart);
    },
    computed: {
        totalPrice() {
            return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
        },
        totalCartItems() {
            return this.cart.reduce((total, item) => total + item.quantity, 0);
        },
        passwordStrengthMessage() {
            const password = this.showRegister ? this.newUser.password : this.newPassword;
            if (!password) return null;
        
            const length = password.length;
            if (length < 4) {
              return { text: "Meget svagt", color: "red" };
            } else if (length < 8) {
              return { text: "Svagt", color: "orange" };
            } else if (length < 12) {
              return { text: "Medium", color: "blue" };
            } else {
              return { text: "Stærkt", color: "green" };
            }
          }
    },
    methods: {
        async getAllProducts() {
            try {
                const response = await axios.get(ApiUrl, {
                    headers: {
                        "Authorization": `Bearer ${this.token}`
                    }
                });
                this.allProducts = response.data.map(product => {
                    let imageData = product.imageData;
                    if (imageData && typeof imageData === "string" && imageData.length > 0) {
                        imageData = `data:image/jpeg;base64,${imageData}`;
                    } else {
                        imageData = '/images/rolexpepsi.jpg';
                    }
                    return { ...product, imageData };
                });
                // Store the full list of products for reference
                this.products = [...this.allProducts];
            } catch (ex) {
                console.error("Error fetching products:", ex);
                alert(ex.message);
            }
        },
        toggleRegister() {
            this.showRegister = !this.showRegister;
        },
        toggleCartDropdown() {
            this.showCartDropdown = !this.showCartDropdown;
        },
        filterByName(name) {
            if (name) {
                this.products = this.allProducts.filter(product => 
                    product.name.toLowerCase().includes(name.toLowerCase())
                );
            } else {
                this.products = this.allProducts;
            }
        },
        toggleChangePassword() {
            this.showChangePassword = !this.showChangePassword;
        },
        async register() {
            try {
                const response = await axios.post(RegisterUrl, {
                    username: this.newUser.username,
                    email: this.newUser.email,
                    password: this.newUser.password,
                    role: this.newUser.role
                }, {
                    headers: { "Content-Type": "application/json" }
                });

                if (response.status === 201) {
                    this.registerMessage = 'User registered successfully!';
                    this.showRegister = false;
                    
                    this.$nextTick(() => {
                        this.newUser.username = '';
                        this.newUser.email = '';
                        this.newUser.password = '';
                        this.newUser.role = '';
                    });
                } else {
                    this.registerMessage = 'Registration failed!';
                }
            } catch (ex) {
                console.error("Registration error:", ex);
                this.registerMessage = 'Registration error!';
            }
        },
        async changePassword() {
            try {
                const response = await axios.put('https://localhost:7214/api/Users/change-password', {
                    oldPassword: this.oldPassword,
                    newPassword: this.newPassword,
                    confirmPassword: this.confirmPassword
                }, {
                    headers: { "Authorization": `Bearer ${this.token}` }
                });

                if (response.status === 200) {
                    this.passwordChangeMessage = 'Password changed successfully!';
                    this.showChangePassword = false;
                } else {
                    this.passwordChangeError = 'Password change failed!';
                }
            } catch (ex) {
                console.error("Password change error:", ex);
                this.passwordChangeError = 'Password change error!';
            }
        },
        addToCart(product) {
            const cartItem = this.cart.find(item => item.id === product.id);
            if (cartItem) {
                cartItem.quantity++;
            } else {
                this.cart.push({ ...product, quantity: 1 });
            }
            this.saveCart();
        },
        saveCart() {
            localStorage.setItem("cart", JSON.stringify(this.cart));
        },
        handleFileUpload(event) {
            this.selectedFile = event.target.files[0];
            console.log("Selected file:", this.selectedFile);
            this.convertToBase64(this.selectedFile);
        },
        convertToBase64(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.product.imageData = e.target.result.split(',')[1];
                console.log("Base64 image data:", this.product.imageData);
            };
            reader.readAsDataURL(file);
        },
        async addProduct() {
            try {
                const formData = new FormData();
                formData.append("name", this.product.name);
                formData.append("model", this.product.model);
                formData.append("price", this.product.price);
                formData.append("imageData", this.product.imageData);

                if (this.selectedFile) {
                    formData.append("file", this.selectedFile);
                } else {
                    console.error("No file selected!");
                    alert("Vælg venligst en fil før du uploader.");
                    return;
                }

                const response = await axios.post(ApiUrl, formData, {
                    headers: { 
                        "Content-Type": "multipart/form-data",
                        "Authorization": `Bearer ${this.token}`
                    }
                });

                this.uploadMessage = "Produkt tilføjet succesfuldt!";
                this.getAllProducts();
            } catch (ex) {
                console.error("Upload error:", ex.response ? ex.response.data : ex.message);
                alert("Fejl ved upload af produkt.");
            }
        },
        async updateProduct(product, file) {
            try {
                let formData = new FormData();
                formData.append("name", product.name);
                formData.append("model", product.model);
                formData.append("price", product.price);
                if (file) formData.append("file", file);
        
                const response = await axios.put(
                    `https://localhost:7214/api/Products/${product.id}`, 
                    formData, 
                    { 
                        headers: { 
                            "Content-Type": "multipart/form-data",
                            "Authorization": `Bearer ${this.token}` // Tilføjet Authorization header
                        } 
                    }
                );
                alert("Produkt opdateret!");
            } catch (error) {
                console.error("Fejl ved opdatering af produkt:", error);
                alert("Kunne ikke opdatere produktet.");
            }
        },
        async deleteProduct(productId) {
            try {
                const response = await axios.delete(
                    `https://localhost:7214/api/Products/${productId}`, 
                    {
                        headers: {
                            "Authorization": `Bearer ${this.token}` // Tilføjet Authorization header
                        }
                    }
                );
                this.products = this.products.filter(product => product.id !== productId);
                alert('Produkt slettet!');
            } catch (error) {
                console.error('Fejl ved sletning af produkt:', error);
                alert('Kunne ikke slette produktet.');
            }
        },
    async login() {
        if (this.isLockedOut) return; // Stop login hvis brugeren er låst ude
    
        try {
            const response = await axios.post(AuthUrl, {
                username: this.user.username,
                password: this.user.password
            }, {
                headers: { "Content-Type": "application/json" }
            });
    
            const data = response.data;
    
            if (data.token) {
                this.token = data.token;
                localStorage.setItem("token", this.token);
    
                const payload = JSON.parse(atob(this.token.split('.')[1]));
    
                this.isLoggedIn = true;
                this.isAdmin = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]?.toLowerCase() === 'admin';
    
                this.loginMessage = "Login successful!";
            } else {
                this.loginMessage = "Login failed!";
            }
        } catch (ex) {
            if (ex.response && ex.response.status === 429) {
                // Brugeren har lavet for mange forsøg
                this.isLockedOut = true;
                this.remainingTime = 300; // 5 minutter (300 sekunder)
                this.startCountdown();
                this.loginMessage = "For mange forkerte forsøg! Prøv igen om 5 minutter.";
            } else {
                console.error("Login error:", ex);
                this.loginMessage = "Login error!";
            }
        }
    },
    logout() {
        this.isAdmin = false;
        this.isLoggedIn = false;
        this.user.username = "";
        this.user.password = "";
        this.loginMessage = "Logout successful!";
        this.token = "";
        localStorage.removeItem("token");
    },

    sortByName() {
        this.products.sort((a, b) => a.name.localeCompare(b.name));
    },
    sortByPriceAscending() {
        this.products.sort((a, b) => a.price - b.price);
    },
    sortByPriceDescending() {
        this.products.sort((a, b) => b.price - a.price);
    },
        toggleLogin() {
            this.showLogin = !this.showLogin;
        },
        async checkToken() {
            if (!this.token) return;
        
            try {
                const payload = JSON.parse(atob(this.token.split('.')[1]));
                this.isLoggedIn = true;
                this.isAdmin = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]?.toLowerCase() === 'admin';
            } catch (error) {
                console.error("Error decoding token:", error);
                this.isLoggedIn = false;
                this.isAdmin = false;
            }
        },
        checkPasswordStrength(password) {
            let strength = 0;
            if (password.length >= 8) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
        
            if (strength === 0) return { text: "Meget svagt", color: "red" };
            if (strength === 1) return { text: "Svagt", color: "orange" };
            if (strength === 2) return { text: "Middel", color: "yellow" };
            if (strength === 3) return { text: "Stærkt", color: "lightgreen" };
            return { text: "Meget stærkt", color: "green" };
        },
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
        },
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
        }, 
        mounted() {
            // Hent kurvdata fra localStorage eller API
            this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        },
        startCountdown() {
            const interval = setInterval(() => {
                this.remainingTime--;
                if (this.remainingTime <= 0) {
                    clearInterval(interval);
                    this.isLockedOut = false;
                    this.loginMessage = "";
                }
            }, 1000);
        },
        
    },
}).mount('#app');