
const mongoose = require('mongoose')
const Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

const UserCollection = new Schema({
    username: { type: String, trim: true, unique: true },
    password: String,
    playlist: { type: ObjectId, ref: 'Playlist' },
    nowPlayingIndex: { type: Number, default: 0 },
    members: [String]
});

module.exports = mongoose.model('User', UserCollection);