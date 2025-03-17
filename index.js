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
        };
    },
    created() {
        this.getAllProducts();
        this.checkToken();
    },
    computed: {
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
            // Implement change password logic here
            // Example:
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
        async login() {
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
                    this.loginMessage = "Login successful!";
                    this.isLoggedIn = true;
                    this.isAdmin = true;
                } else {
                    this.loginMessage = "Login failed!";
                }
            } catch (ex) {
                console.error("Login error:", ex);
                this.loginMessage = "Login error!";
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
        toggleLogin() {
            this.showLogin = !this.showLogin;
        },
        checkToken() {
            if (this.token) {
                this.isLoggedIn = true;
            }
        },
    },
}).mount('#app');