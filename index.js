const express = require('express');
const http = require('http');
const path = require('path');
const _ = require('lodash');
const bodyParser = require('body-parser');

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



server.listen(port, () => {
	console.log(`Server is up on port ${port}`);
});