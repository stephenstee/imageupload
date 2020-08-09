var mongoose = require("mongoose");

var imageSchema = new mongoose.Schema({
	name: String,
	image: String,
	imageId: String,
	description:String,
});

var Image = mongoose.model("Image", imageSchema);

module.exports = Image;