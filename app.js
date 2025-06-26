const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing")
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

// Calling main function 
main().then(() =>{
    console.log("Connect to DB");
}).catch(err => {
    console.log(err);
});

// Create a Database
async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}
app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));

app.use(express.static(path.join(__dirname, "/public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) =>{
    res.send("Hi, I am root");
});

// Sample Listings
// app.get("/testListing", async(req, res) =>{
//     let sampleListing = new Listing ({
//         title: "My New Villa",
//         description: "By the Beach",
//         price: 1000000,
//         location: "Patna, Bihar",
//         country: "India",
//     });
//     await sampleListing.save();  //.save return promises
//     console.log("Sample was Saved");
//     res.send("Successful testing");
// });

// schemaValidation Middleware
const validateListing = (req, res, next) =>{
    let {error} = listingSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, error);
    } else{
        next();
    }
};

const validateReview = (req, res, next) =>{
    let {error} = reviewSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, error);
    } else{
        next();
    }
};


// Index Route 
app.get("/listings",validateListing, wrapAsync(async(req, res) => {
    const allListings = await Listing.find({});
    console.log(allListings); // Check for duplicates
    res.render("listings/index.ejs", { allListings });
}));

// New Route  -> New Write Before Show Route because it considered as a Id  
app.get("/listings/new", wrapAsync(async(req, res) =>{
    res.render("listings/new.ejs");
}));

// Show Route 
app.get("/listings/:id", wrapAsync(async(req, res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", {listing});
}));

// Create Route 
app.post("/listings", upload.single("image"), wrapAsync(async (req, res, next) => {
    let result = listingSchema.validate(req.body);
    console.log(result);
    if (result.error) {
        throw new ExpressError(400, result.error);
    }
    
    const newListing = new Listing(req.body.listing); 
    await newListing.save();
    res.redirect("/listings");
}));

// Edit Route
app.get("/listings/:id/edit", wrapAsync(async(req, res) =>{
    let {id} = req.params;
    let listing = await Listing.findById(id);
    res.render("listings/edit.ejs", {listing});
}));

// Update Route
app.put("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
if(typeof req.file !== "undefined"){
    let url=req.file.path;
    let filename=req.file.filename;
    listing.image={url,filename};
    await listing.save();
  }
    res.redirect(`/listings/${id}`);
}));

// Delete Route 
app.delete("/listings/:id", wrapAsync(async(req, res) =>{
    let {id} = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    console.log(deleteListing);
    res.redirect("/listings");
}));

// Reviews Route
// POST Review Route
app.post("/listings/:id/reviews", validateReview, wrapAsync(async (req, res) =>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review (req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    // console.log("New Review Saved");
    // res.send("New Review Saved");

    res.redirect(`/listings/${listing._id}`);
}));

// Delete Review Route
app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async(req, res) => {
    let { id, reviewId} = req.params;

    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
}));

// 404 Handler
app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Error Handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", {message});
//   res.status(statusCode).render("error", { statusCode, message });
});

const port = 8080;
app.listen(port, () =>{
    console.log(`Server is listening to port ${port}`);
});