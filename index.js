const ApiUrl = 'https://localhost:7214/api/Products';
const AuthUrl = 'https://localhost:7214/api/Users/login'; // URL til login endpoint

Vue.createApp({
    data() {
        return {
            products: [],
            selectedFile: null,
            idToGetById: 0,
            singleProduct: null,
            deleteId: 0,
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
    },
}).mount('#app');