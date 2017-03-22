import mongoose from 'mongoose';

const config = {};

config.mongoURI = {
  development: 'mongodb://mano:123@ds055575.mongolab.com:55575/mano',
  test: 'mongodb://mano:123@ds021182.mlab.com:21182/zssn'
};

// console.log(process.env);
// Build the connection string
const dbURI = config.mongoURI[process.env.NODE_ENV];

// Create the database connection
mongoose.connect(dbURI);



// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', () => {
  console.log('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose default connection disconnected');
});

// When the connection is open
mongoose.connection.once('open', () => {
  console.log('Mongoose default connection is open');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});
