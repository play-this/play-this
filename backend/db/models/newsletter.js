
const mongoose = require('mongoose')
const Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

const NewsletterCollection = new Schema({
    email: {
        type: String,
        unique: true
    }
});

module.exports = mongoose.model('Newsletter', NewsletterCollection);