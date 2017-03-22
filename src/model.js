
// app/models/user.js
// load the things we need
import mongoose from 'mongoose';

// define the schema for our user model
const userSchema = mongoose.Schema({
  local: {
    email: String,
    password: String,
  },
  facebook: {
    id: String,
    token: String,
    email: String,
    name: String,
    photo: String
  },
  twitter: {
    id: String,
    token: String,
    displayName: String,
    username: String
  },
  google: {
    id: String,
    accessToken: String,
    refreshToken: String,
    email: String,
    name: String
  }

});

const User = mongoose.model('User', userSchema);

const userMethods = {
  findOrCreate(user, done) {
    // console.log(user.refreshToken, 'refreshToken');
    User.findOne({ 'google.id': user.profile.id }, (err, userFound) => {
      // if there is an error, stop everything and return that
      // ie an error connecting to the database
      if (err) {
        return done(err);
      }
      console.log(userFound.google.id);
      // if the userFound is found, then log them in
      if (userFound) {
        userFound.google.id = user.profile.id;
        userFound.google.name = user.profile.displayName;
        userFound.google.accessToken = user.accessToken;
        userFound.google.email = user.profile.emails[0].value;
        userFound.save((error) => {
          if (error) {
            return done(error);
          }
          return done(null, userFound); // user found, return that user
        });
      } else {
        // if there is no user found with that facebook id, create them
        const newUser = new User();

        // set all of the facebook information in our user model
        newUser.google.id = user.profile.id; // set the users google id
        newUser.google.accessToken = user.accessToken;
        newUser.google.refreshToken = user.refreshToken;
        newUser.google.name = user.profile.displayName;
        newUser.google.email = user.profile.emails[0].value; // pull the first email
        // newUser.google.email = profile.emails[0].value;

        // save our user to the database
        newUser.save((error) => {
          if (error) {
            throw error;
          }
          // console.log(newUser);

          // if successful, return the new user
          return done(null, newUser);
        });
      }
    });
  },
  findById(id, callback) {
    const query = { _id: id };
    User.findOne(query, (error, user) => {
      if (error) {
        return callback(error);
      }
      
      return callback(null, user);
    });
  },
  findByToken(id, callback) {
    const query = { 'google.accessToken': id };
    User.findOne(query, (error, user) => {
      if (error) {
        console.log('errorrdslkfdkl');
        return callback(error);
      }
      return callback(null, user);
    });
  },
  updateUser(query, update, callback) {
    User.findOneAndUpdate(query, { $set: update }, { new: true }, (error, user) => {
      if (error) {
        return callback(error);
      }
      return callback(null, user);
    });
  }
};

export default userMethods;
