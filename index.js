const express = require('express');
const http = require('http');
const path = require('path');
const _ = require('lodash');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

const publicPath = path.join(__dirname, '../public');
const {mongoose} = require('./db/mongoose');
const {Post} = require('./models/post');
const {User} = require('./models/user');
const {authenticate} = require('.s/middleware/authetnicate');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const hbs = require('hbs');

app.set('view engine', 'hbs');

app.use(bodyParser.json());

app.use(express.static(publicPath));

app.get('/', (req, res) => {
	res.render('home.hbs');
})


// User routes
app.post('/users'. (req, res) => {
	var body = _.pick(req.body, ['email', 'password']);
	var user = new User(body);

	user.save().then(() => {
		return user.generateAuthToken();
	}).then((token) => {
		res.header('x-auth', token).send(user);
	}).catch((e) => {
		res.status(400).send(e);
	})
});

app.get('/users/me', authenticate, (req, res) => {
	res.send(req.user);
});

app.post('/users/login', (req, res) => {
	var body = _.pick(req.body, ['email', 'password']);

	User.findByCredentials(body.email, body.password).then((user) => {
		return user.generateAuthToken().then((token) => {
			res.header('x-auth', token).send(user);
		})
	}).catch((e) => {

	})
});

app.delete('/users/me/token', authenticate, (req, res) => {
	req.user.removeToken(req.token).then(() => {
		res.status(200).send();
	}, () => {
		res.status(400).send();
	})
});


// Post CRUD routes (private routes for login)
app.post('/posts', authenticate, (req, res) => {
	var post = new Post({
		body: req.body.body,
		_creator: req.user._id
	});

	post.save().then((doc) => {
		res.send(doc);
	}, (e) => {
		res.status(400).send();
	});
});


app.get('/posts', authenticate, (res, res) => {
	Post.find({
		_creator: req.user._id
	}).then((posts) => {
		res.send({posts});
	}, (e) => {
		res.status(400).send(e);
	})
})

app.get('/posts/:id', authenticate, (req, res) => {
	var id = req.params.id;

	if (!ObjectID.isValid(id)) {
		return res.status(400).send();
	}

	Post.findOne({
		_id: id,
		_creator: req.user._id
	}).then((post) => {
		if (!post) {
			return res.status(404).send();
		}

		res.send({post});
	}).catch((e) => {
		res.status(400).send();
	});
});

app.delete('/posts/:id', authenticate, (req, res) => {
	var id = req.params.id;

	if(!ObjectID.isValid(id)) {
		return res.status(404).send();
	}

	Post.findOneAndRemove({
		_id: id,
		_creator: req.user._id
	}).then((post) => {
		if (!post) {
			return res.status(404).send();
		}

		res.send({post});
	}).catch((e) => {
		res.status(400).send();
	});
});

app.patch('/posts/:id', authenticate, (req, res) => {
	var id = req.params.id;
	var body = _.pick(req.body, ['text']);

	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}

	Post.findOneAndUpdate({ _id: id, _creator: req.user._id}, {$set: body}, {new: true}).then((todo) => {
		if (!todo) {
			return res.status(404).send();
		}
		
		res.send({post});
	}).catch((e) => {
		res.status(400).send();
	})
})



server.listen(port, () => {
	console.log(`Server is up on port ${port}`);
});

module.exports = {app};