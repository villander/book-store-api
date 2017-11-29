
// app/models/user.js
// load the things we need
import mongoose from 'mongoose';
import request from 'request';
import _ from 'lodash';

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
  wishlist: [{
    id: String,
    bookId: String,
    title: String,
    img: String,
    author: String,
    book: String
  }],
  booksViewed: [{
    id: String,
    bookId: String
  }],
  booksPurchased: [{
    id: String,
    bookId: String
  }],
  google: {
    id: String,
    accessToken: String,
    refreshToken: String,
    email: String,
    name: String,
    userID: String,
    favoriteInfo: {}
  }

});

const User = mongoose.model('User', userSchema);

const userMethods = {
  getWishlist(userGoogleId, done) {
    User.findOne({
      'google.id': userGoogleId
    }, (err, userFound) => {
      if (err || userFound === null) {
        done(err);
      }

      return done(null, userFound.wishlist);
    });
  },

  addViewedItem(userGoogleId, bookId, done) {
    User.findOne({
      'google.id': userGoogleId
    }, (err, userFound) => {
      if (err || userFound === null) {
        done(err);
      }

      const prodIndex = userFound.booksViewed.findIndex((product) => {
        return product.bookId === bookId;
      });

      if (prodIndex !== -1) { // book already registered
        const book = userFound.booksViewed.find((element) => {
          return element.bookId === bookId;
        });
        done(null, book);
      } else {
        userFound.booksViewed.push({ bookId });
        userFound.save((error, updatedUser) => {
          if (error || updatedUser === null) {
            done(error);
          }

          const book = updatedUser.booksViewed.find((element) => {
            return element.bookId === bookId;
          });

          done(null, book);
        });
      }
    });
  },

  addBooksPurchased(userGoogleId, bookIds, done) {
    User.findOne({
      'google.id': userGoogleId
    }, (err, userFound) => {
      if (err || userFound === null) {
        done(err);
      }

      bookIds.forEach((bookId) => {
        userFound.booksPurchased.push({ bookId });
      });

      userFound.save((error, updatedUser) => {
        if (error || updatedUser === null) {
          done(error);
        }

        done(null, updatedUser.booksPurchased);
      });
    });
  },

  addWishlistItem(userGoogleId, item, done) {
    User.findOne({
      'google.id': userGoogleId
    }, (err, userFound) => {
      if (err || userFound === null) {
        done(err);
      }

      userFound.wishlist.push(item);
      userFound.save((error, updatedUser) => {
        if (error || updatedUser === null) {
          done(error);
        }

        const book = updatedUser.wishlist.find((element) => {
          return element.bookId === item.bookId;
        });

        done(null, book);
      });
    });
  },

  removeWishlistItem(userGoogleId, item, done) {
    User.findOne({
      'google.id': userGoogleId
    }, (err, userFound) => {
      if (err || userFound === null) {
        done(err);
      }

      const prodIndex = userFound.wishlist.findIndex((product) => {
        return product.bookId === item.id;
      });

      if (prodIndex !== -1) {
        userFound.wishlist.splice(prodIndex, 1);
      }

      userFound.save((error, updatedUser) => {
        if (error || updatedUser === null) {
          done(error);
        }

        done(null, updatedUser.wishlist);
      });
    });
  },

  findOrCreate(user, done) {
    // console.log(user.refreshToken, 'refreshToken');
    User.findOne({ 'google.id': user.profile.id }, (err, userFound) => {
      // if there is an error, stop everything and return that
      // ie an error connecting to the database
      if (err) {
        return done(err);
      }
      // console.log(userFound.google.id);
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
        // if there is no user found with that google id, create them
        const options = {
          url: `https://www.googleapis.com/books/v1/mylibrary/bookshelves/0/volumes?key=Z-RmqwmHinAfC-m3azRm38Dc`,
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        };

        function callback(error, response, body) {
          console.log(response.statusCode, 'favelou', response.statusCode);
          if (!error && response.statusCode === 200) {
            const info = JSON.parse(body);
            // const selfLink = info.items[0].selfLink;
            // const userID = selfLink.split('/users/')[1].split('/bookshelves/')[0];

            const favoriteInfo = info.items || [];

            // console.log('user id: ', userID);
            console.log('user favorite: ', favoriteInfo);

            const newUser = new User();

            console.log('refreshToken', user.refreshToken);

            // set all of the facebook information in our user model
            newUser.google.id = user.profile.id; // set the users google id
            newUser.google.accessToken = user.accessToken;
            newUser.google.refreshToken = user.refreshToken;
            // newUser.google.userID = userID;
            newUser.google.favoriteInfo = favoriteInfo;
            newUser.google.name = user.profile.displayName;
            newUser.google.email = user.profile.emails[0].value; // pull the first email
            // newUser.google.email = profile.emails[0].value;

            // save our user to the database
            newUser.save((saveError) => {
              if (saveError) {
                throw saveError;
              }
              // console.log(newUser);

              // if successful, return the new user
              return done(null, newUser);
            });
          } else if (response.statusCode === 401) {
            console.log('error: ', error);
          }
        }
        request(options, callback);
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

  findByGoogleId(id, callback) {
    const query = { 'google.id': id };
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
