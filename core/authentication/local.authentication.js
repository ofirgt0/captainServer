/**
authentication using email and password
 */
 
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const users = require('../users');

passport.use(
	new LocalStrategy({
		usernameField: 'email'
	}, function(email, password, done) {
		const user = users.find(function(user) {
			return user.email === email && user.password === password;
		});
		if (user) {
			done(null, user);	
		} else {
			done(null, false);	
		}
	})
);
