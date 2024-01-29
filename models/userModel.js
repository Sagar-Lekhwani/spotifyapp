const mongoose = require('mongoose')

const plm = require('passport-local-mongoose')

const userSchema = mongoose.Schema({
    username:String,
    email:String,
    contact:String,
    playlist:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'playlist'
        }
    ],
    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'song'
        }
    ],
    profileImg:{
        type:String,
        default:'user.png',
    },
    isAdmin:{
        type:Boolean,
        default:false,
    },
})

userSchema.plugin(plm)

const userModel = mongoose.model('user', userSchema)

module.exports = userModel;
