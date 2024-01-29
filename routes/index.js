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
var crypto = require('crypto')

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

router.get('/', IsLoggedIn ,(req,res,next) => {
  res.render('index');
})

// user authenticate routes 
router.post('/register' ,(req,res,next) => {
  var newUser = {
    username:req.body.username,
    email:req.body.email,
  }
  users.register(newUser,req.body.password)
  .then((result) => {
    passport.authenticate('local')(req,res,() =>{
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

router.get('/upload' ,  IsAdmin , (req,res,next) => {
  res.render('upload')
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

router.post('/uploadmusic' , upload.single('song') , async (req,res,next) => {
  const songData = id3.read(req.file.buffer)

  var randomName = crypto.randomBytes(20).toString('hex')
  // console.log(req.file);

  Readable.from(req.file.buffer).pipe(gfsBucket.openUploadStream(randomName))
  
  Readable.from(songData.image.imageBuffer).pipe(gfsBucketposter.openUploadStream(randomName + 'poster'))

  await songModel.create({
    title:songData.title,
    artist:songData.artist,
    album:songData.album,
    size:req.file.size,
    poster:randomName + 'poster',
    filename:randomName, 
  })

  res.send('music uploaded')
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
function IsAdmin (req, res, next){
  if (req.isAuthenticated() ) {
    users.findOne({username:req.session.passport.user}).then((user) => {
      if(user.isAdmin) return next();
    })
  }
  else{
    console.warn("username or password is incorrect")
    res.redirect('/admin');
  }
}

module.exports = router;
