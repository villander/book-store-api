import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../model';
import db from './db'; // eslint-disable-line
import configAuth from './auth';
import cors from 'cors';
import session from 'express-session';
import refresh from 'passport-oauth2-refresh';
import request from 'request';

// import boolParser from 'express-query-boolean';

// import routes
// import routerSurvivors from '../modules/survivors/api/routes';

const app = express();

// Configure view engine to render EJS templates.
app.set('views', './views');
app.set('view engine', 'ejs');

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// parse body params and attache them to req.body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
// app.use(boolParser());

app.use(passport.initialize());
app.use(passport.session());

// used to serialize the user for the session
passport.serializeUser((user, done) => {
  // console.log(user, 'serialize');
  console.log(user.id, 'serialize');
  done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

const { clientID, clientSecret, callbackURL } = configAuth[process.env.NODE_ENV].googleAuth;

const strategy = new GoogleStrategy({
  clientID,
  clientSecret,
  callbackURL
}, (accessToken, refreshToken, profile, done) => {
  // User.findOrCreate({ googleId: profile.id }, (err, user) => {
  //   return cb(err, user);
  // });
  const user = { profile, accessToken, refreshToken };
  User.findOrCreate(user, done);
});

passport.use(strategy);
refresh.use(strategy);

// const rule = new schedule.RecurrenceRule();
// rule.minute = new schedule.Range(0, 59, 1);


// function requestBooks(req, res) {

//   function send401Response() {
//     return res.status(401).end();
//   }

//   User.findById(req.user._id, (err, user) => {
//     if (err || !user) {
//       return send401Response();
//     }
//     const options = {
//       url: 'https://www.googleapis.com/books/v1/mylibrary/bookshelves?key=z0rlMy9mmp0d-ZT-uCkhdFkF',
//       headers: {
//         Authorization: `Bearer ${user.google.accessToken}`
//       }
//     };

//     function callback(error, response, body) {
//       if (!error && response.statusCode === 200) {
//         let info = JSON.parse(body);
//         console.log(info);
//       } else if (response.statusCode === 401) {
//         refresh.requestNewAccessToken('google', user.google.refreshToken, (err, accessToken) => {
//           if (err || !accessToken) { return send401Response(); }
//           console.log(accessToken, 'new access_token');
//           const query = { _id: user._id };
//           const update = { 'google.accessToken': accessToken };
//           // Save the new accessToken for future use
//           User.updateUser(query, update, (err, userUpdated) => {
//             if (err) {
//               throw err;
//             }
//             console.log('new refreshToken', userUpdated.google);
//             request(options, callback);
//           });
//         });
//       }
//     }
//     console.log('chamou');
//     console.log(options.url, options.headers);
//     request(options, callback);
//   });
// }

function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on
  // console.log(req.user, 'req.user');
  console.log('uepa', req.isAuthenticated());
  if (req.isAuthenticated()) {
    return next();
  }
  // if they aren't redirect them to the home page
  return res.redirect('/');
}

const router = express.Router(); // eslint-disable-line
router.get('/', (req, res) => {
  // console.log('aqui');
  res.render('index.ejs'); // load the index.ejs file
});
router.get('/logado', isLoggedIn, (req, res) => {
  // console.log('aqui');
  // console.log(req.user, 'opaa');
  // schedule.scheduleJob(rule, function () {
  //   requestBooks(req, res);
  // });
  const environment = process.env.NODE_ENV;
  res.render(`${environment}-auth.ejs`, { user: req.user });
  // res.render('mano.ejs'); // load the index.ejs file
});

function validateRequest(req, res, next) {
  console.log('valida');
  const bearerHeader = req.headers['authorization'];
  const userId = req.headers['x-key'];
  const userToken = bearerHeader.split(' ')[1];

  if (userToken || userId) {
    return User.findByGoogleId(userId, (err, user) => {
      if (err || user === null) {
        return res.status(401).json({ error: err });
      } else {
        if (user.google.accessToken !== userToken) {
          return res.status(401).json({ error: 'Token expired' });
        }
        // req.user = user;
        return next();
      }
    });
  } else {
    return res.status(401).json({ error: 'Token or user invalid' });
  }
}

router.get('/api/codes', validateRequest, (req, res) => {
  // const bearerHeader = req.headers['authorization'];
  // console.log(bearerHeader);
  // if (req.headers['authorization'] !== "Bearer some bs") {
  //   return res.status(401).send('Unauthorized');
  // }
  return res.status(200).send({
    codes: [
      { id: 1, description: 'Obama Nuclear Missile Launching Code is: lovedronesandthensa' },
      { id: 2, description: 'Putin Nuclear Missile Launching Code is: invasioncoolashuntingshirtless' }
    ]
  });
});

router.get('/api/books/:id', validateRequest, (req, res) => {
  const options = {
    url: `https://www.googleapis.com/books/v1/volumes/${req.params.id}`
  };

  function callback(error, response, body) {
    if (!error && response.statusCode === 200) {
      const book = JSON.parse(body);
      return res.status(200).json({ book });
    } else if (response.statusCode === 401) {
      return res.status(401).end();
    }
  }
  request(options, callback);
});

router.get('/api/wishlists/', validateRequest, (req, res) => {
  const userId = req.headers['x-key'];
  User.getWishlist(userId, (err, wishlist) => {
    if (err || !wishlist) {
      console.log(err);
      console.log('wishlist', wishlist);
      return res.status(500).json({
        message: 'Error accessing database.'
      });
    }
    return res.status(200).json({ wishlist });
  });
});


router.post('/api/wishlists/', validateRequest, (req, res) => {
  const userId = req.headers['x-key'];
  const item = req.body.wishlist;
  User.addWishlistItem(userId, item, (err, wishlist) => {
    if (err || !wishlist) {
      return res.status(401).end();
    }
    return res.status(201).json({ wishlist });
  });
});

router.delete('/api/wishlists/:id', validateRequest, (req, res) => {
  const userId = req.headers['x-key'];
  console.log(req.params);
  const item = { id: req.params.id };
  User.removeWishlistItem(userId, item, (err, wishlist) => {
    if (err || !wishlist) {
      return res.status(401).end();
    }
    console.log(wishlist);
    return res.status(201).json({ wishlist });
  });
});

router.get('/api/books', validateRequest, (req, res) => {
  console.log(req.isAuthenticated(), 'está auth');
  console.log(req.user, 'req.user');
  const bearerHeader = req.headers.authorization;
  const userToken = bearerHeader.split(' ')[1];
  let startIndex = 0;
  if (req.query.page === '1') {
    startIndex = 0;
  } else {
    startIndex = (((Number(req.query.page)) * 40) - 40);
  }

  User.findByToken(userToken, (err, user) => {
    if (err || !user) {
      return res.status(401).end();
    }
    // https://www.googleapis.com/books/v1/volumes?q=poesia+javascript
    const options = {
      url: `https://www.googleapis.com/books/v1/volumes?q=livros&startIndex=${startIndex}&maxResults=40&key=Z-RmqwmHinAfC-m3azRm38Dc`,
      headers: {
        Authorization: `Bearer ${user.google.accessToken}`
      }
    };

    const books = [];

    function callback(error, response, body) {
      if (!error && response.statusCode === 200) {
        const info = JSON.parse(body);
        info.items.forEach((book) => {
          books.push(book);
        });
        const countDecimals = (value) => {
          if (Math.floor(value) === value) return 0;
          return value.toString().split('.')[1].length || 0;
        };
        const pagesPerItens = ((info.totalItems) / 40);
        const totalPagesIsDecimal = countDecimals(pagesPerItens);
        let totalPages;
        if (totalPagesIsDecimal) {
          totalPages = (totalPagesIsDecimal ? Math.trunc(pagesPerItens) + 1 : pagesPerItens);
        }
        const meta = {
          total_pages: totalPages,
        };
        return res.status(200).json({ books, meta });
      } else if (response.statusCode === 401) {
        return res.status(401).end();
      }
    }
    request(options, callback);
  });
});

// router.post('/token', (req, res) => {
//   if (req.body.username === 'login' && req.body.password === 'ok') {
//     res.send({ access_token: "some bs" });
//   } else {
//     res.status(400).send({ error: 'invalid_grant' });
//   }
// });

router.get('/auth/google',
  passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/books', 'profile', 'email'],
    accessType: 'offline',
    approvalPrompt: 'auto'
  }));

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('user: ', req.user);
    // Successful authentication, redirect home.
    res.redirect('/logado');
  });

// route for logging out
app.get('/api/logout', (req, res) => {
  req.logout();
  res.status(200).json({
    status: 'Bye!'
  });
});

app.use('/', router);

// const api = {};
// api.survivors = routerSurvivors;


// app.use('/api/survivors', api.survivors);



// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => { // eslint-disable-line
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => { // eslint-disable-line
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});

export default app;
