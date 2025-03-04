const ApiUrl = 'https://localhost:7214/api/Products';

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
            product: Vue.reactive({
                name: "",
                model: "",
                price: 0,
                imageData: ""  // Sørg for at imageData eksisterer
            }),
        };
    },
    created() {
        this.getAllProducts();
    },
    methods: {
        async getAllProducts() {
            try {
                const response = await axios.get(ApiUrl);
                this.products = response.data.map(product => ({
                    ...product,
                    image: product.image || '/images/rolexpepsi.jpg' // Tilføjer placeholder image
                }));
                console.log(this.products);
            } catch (ex) {
                alert(ex.message);
            }
        },
        handleFileUpload(event) {
            this.selectedFile = event.target.files[0];
            console.log("Selected file:", this.selectedFile); // Debugging
        },        
        async addProduct() {
            try {
                const formData = new FormData();
                formData.append("name", this.product.name);
                formData.append("model", this.product.model);
                formData.append("price", this.product.price);
                
                if (this.selectedFile) {
                    formData.append("file", this.selectedFile); // Tilføj filen korrekt
                } else {
                    console.error("No file selected!"); // Debug-log hvis ingen fil er valgt
                    alert("Vælg venligst en fil før du uploader.");
                    return;
                }
        
                const response = await axios.post(ApiUrl, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
        
                this.uploadMessage = "Produkt tilføjet succesfuldt!";
                this.getAllProducts();
            } catch (ex) {
                console.error("Upload error:", ex.response ? ex.response.data : ex.message);
                alert("Fejl ved upload af produkt.");
            }
        }       
    },
}).mount('#app');