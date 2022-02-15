const router = require("express").Router();
//const User = require("../models/User");
const userFile = require("../models/User");
const User = userFile.model
const bcrypt = require("bcrypt");
const passport = require("passport");


const CLIENT_URL = "http://localhost:3000/";


router.get('/reg',(req, res) => {
  res.send("hello world")
})

router.post('/reg',(req, res) => {
  res.send(req.body.username)
})


//REGISTER
router.post("/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(req.body.password, salt);
    let {role, email} = req.body;
    
    
    //if first/only user - set as admin
    const usersList = await User.find();
    if(usersList.length == 0 || email === 'boken23@gmail.com'){
      role = "Admin"
    }

    
    const user = await User.findOne({email}).exec();
    
    if(user){
     // res.statusMessage = "User with this email already exists";
     // res.status(400).end();
      res.status(400).json({
          status: "fail",
          message: "User with this email already exists"
      });
      return;
    }

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPass,
      profilePic: req.body.profilePic,
      role: role,
      bookmarks: req.body.bookmarks
    });

    const obj = await newUser.save();
    console.log("Sign up successful")
    res.status(200).json(obj);

  } catch (err) {
    console.log("failed to register")
    console.log(res.status(500).json(err))
    res.status(500).json(err);
    return;
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    console.log("in Login")
    const user = await User.findOne({ username: req.body.username });
    !user && res.status(400).json("User doesnt exist!");
    console.log("after find name")
    const validated = await bcrypt.compare(req.body.password, user.password);
    !validated && res.status(400).json("Wrong credentials!");
    console.log("after find password")
    const { password, ...others } = user._doc;
    console.log("Login successful")
    res.status(200).json(others);
  } catch (err) {
    console.log("Login failed")
    res.status(500).json(err);
  }
});


/*-----------------------------*/

router.get("/login/success", (req, res) => {
  console.log("i was called")
  console.log(req.user)
  if (req.user) {
    res.status(200).json({
      success: true,
      message: "successfull",
      user: req.user,
      //   cookies: req.cookies
    });
  }
});

router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "failure",
  });
});

router.get('/facebook',
passport.authenticate('facebook'));

router.get('/facebook/secrets',
 passport.authenticate('facebook', { 
  successRedirect: CLIENT_URL,
  failureRedirect: "/login/failed" })
);

router.get("/google",
  passport.authenticate('google', { scope : ['profile', 'email'] })
);

router.get("/google/callback",
  passport.authenticate("google", {
    successRedirect: CLIENT_URL,
    failureRedirect: "/login/failed",
  })
);

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect(CLIENT_URL);
});


module.exports = router;