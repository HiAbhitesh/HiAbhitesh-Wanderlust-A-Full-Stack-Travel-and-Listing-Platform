const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Listing schema
const listingSchema = new Schema({
    title: {
        type: String,
        required: true, // fixed spelling from "require" to "required"
    },
    description: String,
    image: {
        filename: String,
        url: {
            type: String,
            default: "https://i.pinimg.com/736x/86/28/44/8628446445eb6c971d1546b3eadb33f4.jpg",
            set: (v) => v === "" ? "https://i.pinimg.com/736x/86/28/44/8628446445eb6c971d1546b3eadb33f4.jpg" : v,
        }
    },
    price: Number,
    location: String,
    country: String,
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;