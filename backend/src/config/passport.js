require('dotenv').config();
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { prisma } = require('./db');
const { logger } = require('../utils/logger');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        passReqToCallback: false
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          if (!profile.emails || profile.emails.length === 0) {
            return done(new Error('No email found in Google profile'));
          }

          const email = profile.emails[0].value.toLowerCase();
          const fullName = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 'Google User';

          // Find user by email
          let user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user) {
            // If user not found, create new Google user
            user = await prisma.user.create({
              data: {
                fullName,
                email,
                provider: 'GOOGLE',
                emailVerified: true,
                role: 'STUDENT'
              }
            });
            logger.info(`Google user created: ${email}`);
          } else {
            // User found, verify provider
            if (user.provider === 'LOCAL') {
              return done(new Error('Email already registered with password'));
            }
          }

          return done(null, user);
        } catch (error) {
          logger.error(`Error in Google OAuth strategy callback: ${error.message}`);
          return done(error);
        }
      }
    )
  );
} else {
  logger.warn('Google OAuth credentials not fully configured. GoogleStrategy is inactive.');
}

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
