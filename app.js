var express = require("express"),
	app = express(),
	mongoose = require("mongoose"),
	expressSession = require("express-session"),
	passport = require("passport"),
	LocalStrategy = require("passport-local"),
	bodyParser= require("body-parser"),
	methodOverride = require("method-override"),
	passportLocalMongoose= require("passport-local-mongoose"),
	User = require("./models/user");


var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dyrnzpky6', 
  api_key: 561868813475496, 
  api_secret: "WoJEZligD_74yqdEVr3OQb-QhGs"
});

app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(expressSession({
	secret:"I have very long hair",
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

mongoose.connect("mongodb+srv://sproutplantbasedeatery:heilseitan@cluster0-2xqv3.gcp.mongodb.net/test?retryWrites=true&w=majority", {useNewUrlParser: true,
												  useUnifiedTopology:true});

app.get("/about", (req,res)=>{
	Event.find({}, (err,events)=>{
		if(err){
			console.log(err)
		}else{
			res.render("home", {events:events,
							   user:req.user})
		}
	})
	
});

app.get("/:eventid/edit", isLoggedIn, (req,res)=>{
	Event.findById(req.params.eventid, (err,event)=>{
		if(err){console.log(err)}
		else{res.render("edit", {event:event})}
	})
});


app.put("/:eventid", upload.single('image'), isLoggedIn, (req,res)=>{
	console.log(req.file);
	cloudinary.uploader.upload(req.file.path, function(result) {
  req.body.event.image = result.secure_url;
	Event.findByIdAndUpdate(req.params.eventid, req.body.event, (err,event)=>{
		if(err){
			console.log(err)
		}else{res.redirect("/about")}
	})})
});

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next()
	}
	else{
		res.redirect("/login")
	}
}

app.get("/:eventid/delete",isLoggedIn, (req,res)=>{
	Event.findById(req.params.eventid, (err,event)=>{
		if(err){console.log(err)}
		else{res.render("delete", {event:event})}
	})
});
app.delete("/:eventid",isLoggedIn, (req,res)=>{
	Event.findByIdAndRemove(req.params.eventid, (err,event)=>{
		if(err){
			console.log(err)
		}else{res.redirect("/about")}
	})
});

app.get("/about/bookings", (req,res)=>{
	res.render("bookings")
});

app.get("/", (req,res)=>{
	res.render("landing")
});

app.post("/about", upload.single('image'), isLoggedIn, (req,res)=>{
	cloudinary.uploader.upload(req.file.path, function(result) {
  req.body.event.image = result.secure_url;
  // add author to campground
	console.log(req.body);
	Event.create(req.body.event, (err,event)=>{
		if(err){
			console.log(err)
		}else{
			res.redirect("/about")
		}
	})})
});
app.get("/about/new", isLoggedIn, (req,res)=>{
	res.render("new")
});
app.get("/login", (req,res)=>{
	res.render("login")
});
app.post("/login", passport.authenticate("local", {
	successRedirect:"/about",
	failureRedirect:"/login"
}), (req,res)=>{
	return
})
;
app.get("/logout", (req,res)=>{
	req.logout();
	res.redirect("/about")
});
var EventSchema = new mongoose.Schema({title:String,
									   date:Date,
									  description:String,
									  price:Number,
									  image:String,
									  hour:String,
									 
									   tax:String
									  });

var Event = mongoose.model("Event", EventSchema);


app.listen(5001, process.env.IP, (err)=>{
	if(err){
		console.log(err)
	}else{
		console.log("Server Up")
	}
})