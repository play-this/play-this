
const mongoose = require('mongoose')
const Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

const PlaylistCollection = new Schema({
    urls: {
        type: Array,
        default: ['EqPtz5qN7HM', 'a5uQMwRMHcs', 'RMxsaTWOVhw']
    },
    name: String
});

const PlaylistModel = mongoose.model('Playlist', PlaylistCollection);
module.exports = PlaylistModel