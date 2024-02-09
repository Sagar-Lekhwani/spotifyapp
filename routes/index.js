var express = require('express');
var router = express.Router();
const multer = require('multer')
const mongoose = require('mongoose')
const { Readable } = require('stream')
var users = require('../models/userModel')
var passport = require('passport');
var localstrategy = require('passport-local');
var id3 = require('node-id3')
var songModel = require('../models/songModel')
var playlistModel = require('../models/playlistModel')
var crypto = require('crypto');
const { title } = require('process');

passport.use(new localstrategy(users.authenticate()));

mongoose.connect('mongodb://0.0.0.0/spotify-app').then(() => {
  console.log('connected to db');
}).catch( err => {
  console.log(err)
})


const conn = mongoose.connection;

var gfsBucket , gfsBucketposter ;

conn.once('open' , () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'audio'
  })
  gfsBucketposter = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'poster'
  })
})

router.get('/', IsLoggedIn ,async (req,res,next) => {
  await users.findOne({username:req.session.passport.user})
  .populate('playlist').populate({
    path:'playlist',
    populate:{
      path:'songs',
      model:'song'
    }
  }).then(async (currentUser) => {
    const Myplaylist = await playlistModel.find().populate('songs')
    res.render('index' , {currentUser , Myplaylist});
  })
})

//poster showing routes 
router.get('/poster/:postername', (req ,res ,next) => {
  gfsBucketposter.openDownloadStreamByName(req.params.postername).pipe(res)
})

//play music routes 
router.get('/stream/:filename', async (req ,res ,next) => {
  const currentSong = await songModel.findOne({filename: req.params.filename})

  const stream = gfsBucket.openDownloadStreamByName(req.params.filename);

  res.set('Content-Type' , 'audio/mpeg');
  res.set('Content-Length' , currentSong.size + 1);
  res.set('Content-Range' , `bytes ${0}-${currentSong.size - 1}/${currentSong.size} `);
  res.set('Content-Ranges' , 'byte');
  res.status(206);

  stream.pipe(res);


  
})

// user authenticate routes 
router.post('/register' ,(req,res,next) => {
  var newUser = {
    username:req.body.username,
    email:req.body.email,
  }
  users.register(newUser,req.body.password)
  .then((result) => {
    passport.authenticate('local')(req,res, async () =>{

      const songs = await songModel.find({});

      const defaultPlaylist = await playlistModel.create({
        name:req.body.username,
        owner:req.user._id,
        songs:songs.map(song => song._id),
      })

      const newUser = await users.findOne({
        _id:req.user._id
      })

      newUser.playlist.push(defaultPlaylist._id);

      await newUser.save();

      res.redirect('/')
    });
  })
  .catch((err) => {
    res.send(err);
  })
})

router.post('/login',passport.authenticate('local' , {
  failureRedirect:'/login',
  successRedirect:'/',
}), function(req, res, next) {});

router.post('/adminlogin',passport.authenticate('local' , {
  failureRedirect:'/admin',
  successRedirect:'/upload',
}), function(req, res, next) {});

router.get('/upload' ,  IsLoggedIn , (req,res,next) => {
  if(req.user.isAdmin) res.render('upload');
  else res.send('access denied')
})

router.get('/logout' , (req,res,next) => {
  if(req.isAuthenticated)
  req.logout((err) => {
     if(err) res.send(err);
     else res.redirect('/login')
  });
else res.redirect('/');
})


router.get('/login' , (req,res,next) => {
  res.render('signin');
})


router.get('/admin' , (req,res,next)  => {
  res.render('admin')
})

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

router.post('/uploadmusic' , upload.array('song') , async (req,res,next) => {

  await Promise.all(req.files.map(async file => {

  

  const songData = id3.read(file.buffer)

  var randomName = crypto.randomBytes(20).toString('hex')
  // console.log(req.file);

  Readable.from(file.buffer).pipe(gfsBucket.openUploadStream(randomName))
  
  Readable.from(songData.image.imageBuffer).pipe(gfsBucketposter.openUploadStream(randomName + 'poster'))

  await songModel.create({
    title:songData.title,
    artist:songData.artist,
    album:songData.album,
    size:file.size,
    poster:randomName + 'poster',
    filename:randomName, 
  })
}))


  res.send('music uploaded')  
})


router.get('/playlist' , IsLoggedIn , (req ,res ,next) => {
  res.render('playlist')
})
router.post('/playlist' , IsLoggedIn , async (req ,res ,next) => {
  const songs = await songModel.find({});

  await playlistModel.create({
    name:'Animal',
    owner:req.user._id,
    songs:songs.filter((song) => {if(song.title === 'Apa Fer Milaangey' || song.title === 'Softly' || song.title === 'Pehle Bhi Main' ) return song._id })
  }).then(()=> {
    res.render('playlist')
  })
})




function IsLoggedIn (req, res, next){
  if (req.isAuthenticated()) {
    return next();
  }
  else{
    console.warn("username or password is incorrect")
    res.redirect('/login');
  }
}
// function IsAdmin (req, res, next){
//   if (req.isAuthenticated() ) {
//     users.findOne({username:req.session.passport.user}).then((user) => {
//       if(user.isAdmin) return next();
//     })
//   }
//   else{
//     console.warn("username or password is incorrect")
//     res.redirect('/admin');
//   }
// }

module.exports = router;
