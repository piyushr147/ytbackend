import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res) => {
    // res.status(200).json({
    //     message:"ok"
    // })
    //console.log(req)
    const {fullName,email,userName,password} = req.body

    //check if fullName is not empty
    if(fullName==="") throw new ApiError(400,"fullname is required")

    const isEmptyField = [fullName,email,userName,password].some((field)=>field?.trim() === "")
    if(isEmptyField) throw new ApiError(400,"All fields are mandatory")

    //check if userName or email alredy exists in database
    const alreadyExist = await User.find({$or:[{userName},{email}]})
    console.log(alreadyExist)
    if(alreadyExist.length) throw new ApiError(409,"User already exists")

     //get the files(avatar,coverImage) from multer and upload it to cloudinary 
    const avatarLocalPath = req.files['avatar'][0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    console.log(avatarLocalPath,coverImageLocalPath)

    //checking of avatar path is required coz it's a madatory field in db
    if(!avatarLocalPath) throw new ApiError(409,"avatar Local path is necessary")

    //uploading avatar and coverImage to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if(!avatar) throw new ApiError(400,"Avtar file can't get uploaded on cloudinary")

    const user = await User.create({
        userName:userName.toLowerCase(),
        email,
        fullName,
        avatar:avatar.url, //url returned by cloudinary as it's response
        coverImage:coverImage?.url||"",
        password
    })

    if(!user) throw new ApiError(409,"something went wrong while registiring the user")

    console.log(user)
    userDetails = await User.findById(user._id).select("-password -refresToken")

    res.status(201).json(new ApiResponse(200,userDetails,"user registration successful"))
})

export {registerUser}