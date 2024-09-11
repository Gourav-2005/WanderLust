const Listing = require("../models/listing");

module.exports.renderNewForm = (req, res) => {
    console.log(req.user);
    res.render("listing/new.ejs");
}

module.exports.index =  async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listing/index.ejs", { allListings });
}

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings")
    }
    console.log(listing);
    res.render("listing/show.ejs", { listing });
}

module.exports.createListing = async (req, res) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.image = { url, filename};
    newListing.owner = req.user._id;
    await newListing.save();
    
    
    req.flash("success", " New Listing created!");
    res.redirect("/listing");
}

module.exports.renderEdit = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings")
    }
    let orignalImageUrl = listing.image.url;
    orignalImageUrl = orignalImageUrl.replace("/upload", "/upload/h_300,w_250")
    res.render("listing/edit.ejs", { listing, orignalImageUrl});
}

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
   
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename};
    await listing.save();
    
    req.flash("success", " Listing updated");
    res.redirect(`/listing/${id}`);
}

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", " Listing deleted");
    res.redirect("/listing");
}