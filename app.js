//jshint esversion:6
require('dotenv').config()
const express = require('express');
const  bodyParser = require('body-parser'); 
const ejs = require('ejs'); 
const mongoose = require('mongoose');

var encrypt = require('mongoose-encryption');



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/secretUserDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})


userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
    res.render("home");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/login", function(req, res){
    res.render("login");
});


app.post("/register", function(req, res){

    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });

    //COME BACK to insert the logic for if a user is registered 

    newUser.save(function(err){
        if(!err){
            res.render("secrets");
        } else {
            console.log(err);
        }

    });

});

app.post("/login", function(req, res){

    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, function(err, doc){
        if(err){
            console.log(err);
        } else {
            console.log("It's getting in here");
            console.log(doc);
            if(doc){
                res.render('secrets');
            } else {
                res.send("Couldn't find user. Did you mean to register?");
            }
        }
    });
})




app.listen(3000, function() {
  console.log("Server started on port 3000");
});