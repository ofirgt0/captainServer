const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const extractToken = require('passport-jwt').ExtractJwt.fromAuthHeaderAsBearerToken;
const users = require('../users');

passport.use(new JwtStrategy({
	secretOrKey: 'secret string',
	jwtFromRequest: extractToken()
}, function(payload, done) {
	const user = users.find((singleUser) => {
		return singleUser.id === payload.userId;
	});
	
	if (user) {
		done(null, user);
	} else {
		done(null, false);
	}
}));