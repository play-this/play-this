const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true });
var conn = mongoose.connection;

conn.on('error', console.error.bind(console, 'connection error:'));

conn.once('open', function (err) {
    if (err) throw err;
});