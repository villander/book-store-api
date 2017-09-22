// expose our config directly to our application using module.exports
module.exports = {
  development: {
    googleAuth: {
      clientID: '102952194911-215ajpdnkuh2uviocad792pmfam1jif2',
      clientSecret: 'Z-RmqwmHinAfC-m3azRm38Dc',
      callbackURL: 'http://localhost:3000/auth/google/callback'
    }
  },
  production: {
    googleAuth: {
      clientID: '102952194911-215ajpdnkuh2uviocad792pmfam1jif2',
      clientSecret: 'Z-RmqwmHinAfC-m3azRm38Dc',
      callbackURL: 'https://morning-mountain-77224.herokuapp.com/auth/google/callback'
    }
  }

};