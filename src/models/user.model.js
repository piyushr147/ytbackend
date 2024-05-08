import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        userName:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true,
        },
        fullName:{
            type:String,
            required:true,
            trim:true,
            lowercase:true,
        },
        avatar:{
            type:String,
            required:true,
        },
        coverImage:{
            type:String
        },
        watchHistory:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        password:{
            type:String,
            required:[true,'password is required'],
        },
        refreshToken:{
            type:String
        }
    },
    {
        timestamps:true
    }
)

userSchema.pre("save",async function(next){
    console.log("calling pre before saving in database")
    if(!this.isModified('password')) next()
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    console.log(password,this.password)
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            userName:this.userName,
            email:this.email,
            fullName:this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User",userSchema)