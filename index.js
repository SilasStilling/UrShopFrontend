const ApiUrl = 'https://localhost:7214/api/Products';
const AuthUrl = 'https://localhost:7214/api/Users/login'; // URL til login endpoint
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
            showLogin: false, // Login-formularens synlighed
            isLoggedIn: false,
            isAdmin: false, // Admin-status
        };
    },
    created() {
        this.getAllProducts();
        this.checkToken();
    },
    methods: {
        async getAllProducts() {
            try {
                const response = await axios.get(ApiUrl, {
                    headers: {
                        "Authorization": `Bearer ${this.token}`
                    }
                });
                console.log("Received products:", response.data); // Debugging
                this.products = response.data.map(product => {
                    let imageData = product.imageData;
                    if (imageData && typeof imageData === "string" && imageData.length > 0) {
                        imageData = `data:image/jpeg;base64,${imageData}`;
                    } else {
                        imageData = '/images/rolexpepsi.jpg'; // Placeholder image
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
        handleFileUpload(event) {
            this.selectedFile = event.target.files[0];
            console.log("Selected file:", this.selectedFile); // Debugging
            this.convertToBase64(this.selectedFile);
        },
        convertToBase64(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.product.imageData = e.target.result.split(',')[1]; // Fjern metadata-delen
                console.log("Base64 image data:", this.product.imageData); // Debugging
            };
            reader.readAsDataURL(file);
        },
        async addProduct() {
            try {
                const formData = new FormData();
                formData.append("name", this.product.name);
                formData.append("model", this.product.model);
                formData.append("price", this.product.price);
                formData.append("imageData", this.product.imageData); // Tilføj imageData

                if (this.selectedFile) {
                    formData.append("file", this.selectedFile); // Tilføj filen korrekt
                } else {
                    console.error("No file selected!"); // Debug-log hvis ingen fil er valgt
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
        addToCart(product) {
            let cart = JSON.parse(localStorage.getItem("cart")) || [];
            let existingProduct = cart.find(item => item.id === product.id);
        
            if (existingProduct) {
                existingProduct.quantity++;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
        
            localStorage.setItem("cart", JSON.stringify(cart));
            alert(`${product.name} tilføjet til kurven!`);
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
                    localStorage.setItem("token", this.token); // Gem token
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
            this.isLoggedIn = false; // Opdater isLoggedIn status
            this.user.username = "";
            this.user.password = "";
            this.loginMessage = "Logout successful!";
            this.token = "";
            localStorage.removeItem("token"); // Fjern token
        },
        toggleLogin() {
            this.showLogin = !this.showLogin;
        },
        checkToken() {
            if (this.token) {
                this.isLoggedIn = true;
            }
        },
        async changePassword() {
            // Tjek om de nye password matcher
            if (this.newPassword !== this.confirmPassword) {
              this.passwordChangeError = "De nye password matcher ikke!";
              return;
            }
        
            // Tjek om det gamle password er korrekt
            if (this.oldPassword !== this.user.password) {  // Forudsætter at `user.password` er det gamle password
              this.passwordChangeError = "Det gamle password er forkert!";
              return;
            }
        
            try {
              // Her kan du lave et API-kald til at ændre passwordet i databasen
              // For eksempel:
              const response = await axios.post('/api/changePassword', {
                oldPassword: this.oldPassword,
                newPassword: this.newPassword
              });
        
              if (response.data.success) {
                this.passwordChangeMessage = "Dit password er blevet ændret!";
                this.passwordChangeError = '';  // Rydder fejlbeskeden, hvis det lykkedes
                this.oldPassword = this.newPassword = this.confirmPassword = '';  // Rydder inputfelterne
              } else {
                this.passwordChangeError = "Fejl ved ændring af password. Prøv igen.";
              }
            } catch (error) {
              console.error(error);
              this.passwordChangeError = "Der opstod en fejl. Prøv igen senere.";
            }
          },
    },
}).mount('#app');