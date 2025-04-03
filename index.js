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
        };
    },
    created() {
        this.getAllProducts();
        this.checkToken();
    },
    computed: {
        totalPrice() {
            return this.cart.reduce((total, item) => total + item.price * item.quantity, 0);
        },
        totalCartItems() {
            return this.cart.reduce((total, item) => total + item.quantity, 0);
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
                console.log("Received products:", response.data);
                this.products = response.data.map(product => {
                    let imageData = product.imageData;
                    if (imageData && typeof imageData === "string" && imageData.length > 0) {
                        imageData = `data:image/jpeg;base64,${imageData}`;
                    } else {
                        imageData = '/images/rolexpepsi.jpg';
                    }
                    return {
                        ...product,
                        imageData
                    };
                });
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
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
                alert("Produkt opdateret!");
            } catch (error) {
                console.error("Fejl ved opdatering af produkt:", error);
                alert("Kunne ikke opdatere produktet.");
            }
        },
        async deleteProduct(productId) {
            try {
                const response = await axios.delete(`https://localhost:7214/api/Products/${productId}`);
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
        logout() {
            this.isAdmin = false;
            this.isLoggedIn = false;
            this.user.username = "";
            this.user.password = "";
            this.loginMessage = "Logout successful!";
            this.token = "";
            localStorage.removeItem("token");
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
    },
}).mount('#app');
