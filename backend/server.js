require('./db');
const cors = require('cors')
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const UserModel = require('./db/models/user')
const PlaylistModel = require('./db/models/playlist')
const NewsletterModel = require('./db/models/newsletter')

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

io.on('connection', function (client) {
  console.log('Client connected...');

  client.on('join', data => {
    if (!data.password) {
      client.join(`${data.username}`)
      io.sockets.in(`${data.username}`).emit('message_from_server', { success: true, message: `socket connection success` })
      return
    }
    const user = UserModel.find({ username: data.username, password: data.password })
    if (user) { // TODO check with memberId: data.memberId too
      client.join(data.username)
      io.sockets.in(data.username).emit('message_from_server', { success: true, message: `socket connection success` })
    }
  });
});

const isUsername = async (req, res) => {
  if (!req.params.username)
    return res.json({ error: 'empty username not supported' });
  let user = await UserModel.find({ username: req.params.username });
  console.log('user: ', user);

  if (user && user.length)
    return res.json({ error: 'username not available' });
  else
    return res.json({ success: true });
}

const createUser = async (req, res) => {
  if (!req.body.username || !req.body.password)
    return res.json({ error: 'empty username/password sent' });

  const user = new UserModel();
  user.username = req.body.username;
  user.password = req.body.password;


  const playlist = new PlaylistModel();
  playlist.name = `${user.username}'s Playlist`;
  playlist.password = req.body.password;

  await playlist.save();

  user.playlist = playlist._id;

  await user.save();

  return res.json({
    success: true,
    playlist
  })

};

const userLogin = async (req, res) => {
  if (!req.body.username || (!req.body.password && !req.body.memberId))
    return res.json({ error: 'empty username/password sent' });

  let returnData = { success: true }
  let user = await UserModel.findOne({ username: req.body.username, password: req.body.password })

  if (!user) {
    user = await UserModel.findOne({
      username: req.body.username,
      members: { $in: req.body.memberId }
    })
    user['isOwner'] = false;
    if (!user)
      return res.json({ error: `Incorrect username or password` })
  } else {
    user['isOwner'] = true;
  }

  const playlist = await PlaylistModel.findById(user.playlist)
  returnData.playlist = playlist
  returnData.user = {
    members: user.members
  }
  return res.json(returnData)
};

// body name is the person who is requesting access to the playlist
const takeAction = async (req, res) => {
  if (!req.params.username)
    return res.json({ error: 'empty username sent' });
  if (req.params.action == 'join' && !req.body.memberId) {
    io.sockets.in(req.params.username).emit('message_from_user', { success: true, action: 'new_member_request', name: req.body.name })
    return res.json({
      success: true,
      info: 'permission requested'
    })
  }
  let user;
  if (req.body.memberId) {
    user = await UserModel.findOne({
      username: req.params.username,
      members: { $in: req.body.memberId }
    })
    if (user)
      io.sockets.in(req.params.username).emit('message_from_user', { success: true, action: req.params.action, data: req.body.data, memberId: req.body.memberId })
  } else if (req.body.password) {
    user = await UserModel.findOne({
      username: req.params.username,
      password: req.body.password,
    })
    if (user) {
      if (req.params.action == 'playlist' && req.body.data) {
        const playlist = await PlaylistModel.findById(user.playlist)
        playlist.urls = req.body.data;
        await playlist.save()
      }
      io.sockets.in(req.params.username).emit('message_from_owner', { success: true, action: req.params.action, data: req.body.data, memberId: req.body.memberId })
    }
  }

  return res.json({
    success: true,
  })
};

const addMember = async (req, res) => {
  const user = await UserModel.updateOne({
    username: req.body.username,
    password: req.body.password,
  }, { $push: { members: req.params.memberId } })
  if (user.nModified)
    io.sockets.in(`${req.body.username}`).emit('message_from_owner', { success: true, action: 'join_request_success', data: { memberId: req.params.memberId } })
  return res.json({
    success: true
  })
};

const removeMember = async (req, res) => {
  const user = await UserModel.updateOne({
    username: req.body.username,
    password: req.body.password,
  }, { $pull: { members: req.params.memberId } })
  if (user.nModified)
    io.sockets.in(`${req.body.username}`).emit('message_from_owner', { success: true, action: 'remove_request_success', data: { memberId: req.params.memberId } })
  return res.json({
    success: true
  })
}

const newsletter = async (req, res) => {
  if (!req.body.email)
    return res.json({ error: 'no email id sent' });

  const newsletter = new NewsletterModel();
  newsletter.email = req.body.email;
  await newsletter.save();

  return res.json({ success: true });
}

// Routes
app.get(`/`, async (req, res) => res.json({ success: true, apiName: `Play This`, apiVersion: 1 }));
app.get(`/user/is/:username`, isUsername);
app.post(`/user/create`, createUser)
app.post(`/user/login`, userLogin)
app.post(`/action/:username/:action`, takeAction)
app.post(`/add/member/:memberId`, addMember)
app.post(`/remove/member/:memberId`, removeMember)
app.post(`/add/news-letter`, newsletter)

http.listen(process.env.PORT || 3000, () => console.log('Server is UP ! *:3000'));
