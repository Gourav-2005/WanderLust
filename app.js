if(process.env.NODE_ENV !='production') {
require('dotenv').config();
};



const express = require("express");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require('body-parser');
const path = require("path");

const dbUrl = process.env.ATLASDB_URL;
const Listing = require("./models/listing.js");
const methodOverride = require("method-override");
const EJSmate = require("ejs-mate");
const session = require("express-session");
const mongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");
const { isLoggedIn, isOwner } = require("./middleware.js");
const { saveRedirectUrl } = require("./middleware.js");
const listingControler = require("./controller/listing.js")
const multer = require("multer");
const { storage } = require("./cloudconfig.js");
const { profileEnd } = require('console');
const upload = multer({storage})
const store = mongoStore.create({
    mongoUrl: dbUrl,
    
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 60 * 60

})

store.on("error", () => {
    console.log("error in mongo store", err);
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUnintialized: true,
    Cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
};



app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

main().then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", EJSmate);
app.use(express.static(path.join(__dirname, "/public")));

async function main() {
    await mongoose.connect(dbUrl);
}

// app.get("/", (req, res) => {
//     res.send("Hi, I am root");
// })

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

//Index route
app.get("/listing",listingControler.index);


//New route
app.get("/listing/new", isLoggedIn,listingControler.renderNewForm);

//Show route
app.get("/listing/:id", listingControler.showListing);

//create route
app.post("/listing", isLoggedIn, upload.single("listing[image]"), listingControler.createListing);



//edit route
app.get("/listing/:id/edit", isLoggedIn,isOwner , listingControler.renderEdit);

//Update-Route
app.put("/listing/:id", isLoggedIn,isOwner,upload.single("listing[image]"), listingControler.updateListing);

//Delete-Route
app.delete("/listing/:id", isLoggedIn,isOwner, listingControler.destroyListing);

//demoUser
// app.get("/demouser", async (req, res) => {
//     let fakeUser = new User({
//         email: "abcd@gmail.com",
//         username: "Delta-Student",
//     });
//     let registeredUser = await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// })

//Signup
app.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

//data of singup form
app.post("/signup", async(req, res) => {
    try{
        let { username, email, password } = req.body;
    const newUser = new User({ username, email })
    const registerdUser = await User.register(newUser, password);
    console.log(registerdUser);
    req.login(registerdUser,(err) => {
        
            if(err){
                return next(err);
                }
                req.flash("success", "Welcome to Wandelust");
                res.redirect("/listing");
    })
    
    }catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }
});

//Login
app.get("/login", (req, res) => {
    res.render("users/login.ejs");
});

app.post("/login",saveRedirectUrl, passport.authenticate("local", {failureRedirect :"/login", failureFlash:true}),async(req,res) => {
    req.flash("success","Welcome to Wanderlust");
    let redirectUrl = res.locals.redirectUrl || "/listing"
    res.redirect(redirectUrl);
})

//Logout
app.get("/logout",(req,res,next) => {
    req.logout((err) => {
        if(err){
            return next(err);
            }
            req.flash("sucess","you are logged out");
            res.redirect("/listing");
    });
    
})
//app.use("/listings", lisitngs);

// app.get("/testlisting",async(req,res) =>{
//     let sampleListing = new Listing({
//         title : "Sample Listing",
//         description : "This is a sample listing",
//         price : 1000.00,
//         lolcation : "Udaipur",
//         country : "India",
//     });
//     await sampleListing.save();
//     res.send("sucessful testing");
// });


app.listen(8080, () => {
    console.log("Server is listning on port 8080");
})