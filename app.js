//jshint esversion:6
require('dotenv').config()
const express = require('express');
const  bodyParser = require('body-parser'); 
const ejs = require('ejs'); 
const mongoose = require('mongoose');
const  session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate')





const app = express();

app.set('view engine', 'ejs');

//mongoose setting
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    
  }))

  app.use(passport.initialize());
  app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/secretUserDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/submit", function(req, res){
    res.render("submit");
})

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){

        User.find({secret: {$ne:null}}, function(err, doc){
            if(err){
                console.log(err);
            } else {
                res.render('secrets', {userSecrets: doc})

            }
        })
    } else {
        res.redirect("/login");
    }
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
 
app.get("/logout", function(req, res){
    //predicted strategy ---> create a user object from the model schema ---> UnAuth the user redirect to home 
    req.logout();
    res.redirect("/");
})


app.post("/register", function(req, res){

    
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) { 
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })

});

app.post("/login", function(req, res){

    
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){ // this basically does all that checking against the database and stuff
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })
})

app.post("/submit", function(req, res){
    const userSecret = req.body.secret; 
    
    

    User.findByIdAndUpdate(req.user.id, {secret: userSecret}, function(err, doc) {
        if(err){
            console.log(err);
        } else {
            res.redirect("/secrets");
        }
    })
})



app.listen(3000, function() {
  console.log("Server started on port 3000");
});