const ApiUrl = 'https://localhost:7214/api/Products';

Vue.createApp({
    data() {
        return {
            products: [],
            idToGetById: 0,
            singleProduct: null,
            deleteId: 0,
            deleteMessage: "",
            newProduct: {
                Model: "",
                Name: "",
                Price: 0,
            },
            addMessage: "",
            product: "",
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
    },
}).mount('#app');
