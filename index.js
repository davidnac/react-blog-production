//jshint esversion:6
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const postRoute = require("./routes/posts");
const multer = require("multer");
const path = require("path");
const userFile = require("./models/User");
const User = userFile.model
const UserSchema = userFile.schema


/*-----------security-----------------*/
const xss = require('xss-clean')
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

//this limit is to prevent DOS (Denial-Of-Service) attacks - limits size
const numOfBytes = '10kb';
//limit amount of requests user can make in specific time - e.g 5 login per minute - also good for brute force
const limiter  = rateLimit({
    max: 200,// // limit each IP to 200 requests per windowMs
    windowMs: 60 * 60 * 1000, // 1 Hour
    message: 'Too many requests' // message to send
});


//prevent Cross-Site Scripting (XSS) Attacks
app.use(xss()); //This will sanitize any data in req.body, req.query, and req.params
app.use(limiter);
app.use(helmet()); //sets headers with good security configuration
/*-----------security-----------------*/

const developmentMode = false;

dotenv.config();
app.use(express.json());

//these 2 are for allowing client side to access images folder in server, for files saved here
app.use(express.static(__dirname + '/public'));
app.use("/images", express.static(path.join(__dirname, "/images")));

if(!developmentMode){
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

mongoose
  .connect(process.env.MONGO_DB_URL)
  .then(console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

/*---------passport-----------*/
const session = require('express-session');
const passport = require("passport");
const cors = require("cors");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;


app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

//User.plugin(passportLocalMongoose);
//passport.use(User.createStrategy());


passport.use(new GoogleStrategy({
  //clientID & clientSecret are from regisration in google api console
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/auth/google/callback"
  },
   async(req, accessToken, refreshToken, profile, cb) => {
    //console.log(profile);
    const googleUser = new User({
      googleId: profile.id,
      username: profile.displayName,
      email: profile.emails[0].value,
      profilePic: profile.photos[0].value,
      role: profile.emails[0].value === 'profile.emails[0].value' ? "Admin" : "User"
    })

    //googleUser.save();

   // return done(null, googleUser);

   const user = await User.findOne({ googleId: profile.id });
   if(!user){
    //user doesnt exist
    const obj = await googleUser.save();
    console.log("Sign up successful")
    res.status(200).json(obj);
    return cb(null,googleUser)
   }else{
    console.log("Sign in successful")
    return cb(null,user)
   }

   /*
    const user = await UserSchema.findOrCreate({where: { googleId: profile.id }, defaults: googleUser}).catch((err) => {
      console.log("error siging up", err)
      cb(err,null);
    });

    if(user){
      return cb(null,user)
    }*/
    
  }));



  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:5000/api/auth/facebook/callback"
    },
     async(req, accessToken, refreshToken, profile, cb) => {
      //console.log(profile);
      const facebookUser = new User({
        googleId: profile.id,
        username: profile.name.givenName + ' ' + profile.name.familyName,
        email: profile.emails[0].value,
        profilePic: profile.photos[0].value,
        role: "User"
      })
  
     const user = await User.findOne({ facebookId: profile.id });
      if(!user){
        //user doesnt exist
        const obj = await facebookUser.save();
        console.log("Sign up successful")
        res.status(200).json(obj);
        return cb(null,facebookUser)
      }else{
        console.log("Sign in successful")
        return cb(null,user)
      }
      
    }));
  /*
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:5000/api/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile);

    User.findOrCreate({ facebbokId: profile.id }, function(err, user) {
      if (err) { return done(err); }
      done(null, user);
    });
  }
));
*/

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
/*---------passport-----------*/


//------------------DB-----------------------------------//



  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "images"); //name of the folder in database
    },
    filename: (req, file, cb) => {
     // cb(null, file.originalname);
      cb(null, req.body.name);
    },
  });
  
  const upload = multer({ storage: storage });
  app.post("/api/upload", upload.single("file"), (req, res) => {
    res.status(200).json("File has been uploaded");
  });

  app.use("/api/auth", authRoute);
  app.use("/api/users", userRoute);
  app.use("/api/posts", postRoute);



  app.listen(process.env.PORT || 5000, function(){
    console.log("Server started on port 5000.");
  })

