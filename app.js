require('dotenv').config();

var express = require("express");
var app = express()
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
var Image = require("./models/image");
var multer = require("multer");
var storage = multer.diskStorage({
	filename: function(req,file,callback){
		callback(null, Date.now() + file.originalname);
	}
})

var imagefilter = function(req,file,cb){
	if(!file.originalname.match(/\.(jpg | jpeg|png|git)$/i)){
	   return cb(new Error('only image files are allowed'), false);
	   }
	cb(null, true);
};

var upload = multer({storage:storage, filefilter:imagefilter});

var cloudinary = require('cloudinary');
cloudinary.config({
	cloud_name:'dokiawcg4',
	api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
})
mongoose.connect("mongodb://localhost/image", {useNewUrlParser:true, useUnifiedTopology:true});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));

app.get("/",function(req,res){
	res.redirect("/home");
})
app.get("/home",function(req,res){
	res.render("welcome");
})

app.get("/home/index",function(req,res){
	Image.find({},function(err,images){
		if(err){
			console.log(err);
		}
		else{
	res.render("home",{image:images});		
		}
	})
    
})


app.post("/home",upload.single('image'),function(req,res){
	cloudinary.v2.uploader.upload(req.file.path, function(err,result){
		if(err){
			req.flash('error', err.message);
			return res.redirect('back');
		}
		req.body.imagee.image = result.secure_url;
		req.body.imagee.imageId = result.public_id;
	Image.create(req.body.imagee, function(err,images){
		if(err){
			req.flash('error', err.message);
			return res.redirect('back');
		}
		res.redirect('/home');
	})
	})
})


app.get("/home/new",function(req,res){
	res.render("new");
})

app.get('/home/:id',function(req,res){
	Image.findById(req.params.id,function(err, images){
		if(err){
			console.log(err);
		}
		else{
			console.log(images);
			res.render("show", {image:images});
		}
	})
})

app.get("/home/:id/edit",  function(req,res){
	Image.findById(req.params.id,function(err, foundimage){
		if(err){
			res.redirect("back");
		}else{
			res.render("edit",{imagee: foundimage});
		}
		
	})
	})

app.put("/home/:id",upload.single('image'),function(req,res){
	Image.findById(req.params.id, async function(err, imagee){
        if(err){
            // req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(imagee.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  imagee.imageId = result.public_id;
                  imagee.image = result.secure_url;
              } catch(err) {
                  // req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            imagee.name = req.body.name;
            imagee.description = req.body.description;
            imagee.save();
            // req.flash("success","Successfully Updated!");
            res.redirect("/home/" + imagee._id);
        }
    });
})

app.delete('/home/:id', function(req, res) {
  Image.findById(req.params.id, async function(err, images) {
    if(err) {
      // req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(images.imageId);
        images.remove();
        // req.flash('success', 'Campground deleted successfully!');
        res.redirect('/home');
    } catch(err) {
        if(err) {
          // req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});




app.listen(process.env.PORT || 3000, process.env.IP, function(){
	console.log("server start");
})
