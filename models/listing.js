const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

// Define the Listing schema
const listingSchema = new Schema({
    title: {
        type: String,
        required: true, 
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
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
});

listingSchema.post("findOneAndDelete", async(listing) => {
    if (listing) {
        await Review.deleteMany({_id: { $in: listing.reviews }});
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;