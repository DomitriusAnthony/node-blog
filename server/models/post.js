var mongoose = require('mongoose');

var Post = mongoose.model('Todo', {
	text: {
		type: String,
		required: true,
		minglength: 1,
		trim: true
	}, 

	_creator: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	}
});

module.exports = {Post};