import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, userName, password } = req.body

    //check if fullName is not empty
    if (fullName === "") throw new ApiError(400, "fullname is required")

    const isEmptyField = [fullName, email, userName, password].some((field) => field?.trim() === "")
    if (isEmptyField) throw new ApiError(400, "All fields are mandatory")

    //check if userName or email alredy exists in database
    const alreadyExist = await User.find({ $or: [{ userName }, { email }] })
    console.log(alreadyExist)
    if (alreadyExist.length) throw new ApiError(409, "User already exists")

    //get the files(avatar,coverImage) from multer and upload it to cloudinary 
    const avatarLocalPath = req.files['avatar'][0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    console.log(avatarLocalPath, coverImageLocalPath)

    //checking of avatar path is required coz it's a madatory field in db
    if (!avatarLocalPath) throw new ApiError(409, "avatar Local path is necessary")

    //uploading avatar and coverImage to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if (!avatar) throw new ApiError(400, "Avtar file can't get uploaded on cloudinary")

    const user = await User.create({
        userName: userName.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url, //url returned by cloudinary as it's response
        coverImage: coverImage?.url || "",
        password
    })

    if (!user) throw new ApiError(409, "something went wrong while registiring the user")

    console.log(user)
    const userDetails = await User.findById(user._id).select("-password -refresToken")

    res.status(201).json(new ApiResponse(200, userDetails, "user registration successful"))
})

const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body

    console.log(userName, email, password)
    if (!userName && !email) throw new ApiError(404, "Provide either username or email.")

    const user = await User.findOne({ $or: [{ userName, email }] })
    if (!user) throw new ApiError(404, "Provided user doesn't exists.")

    //check for password validation
    const validPassword = await user.isPasswordCorrect(password)
    if (!validPassword) throw new ApiError(401, "Wrong password entered")

    //create access and refresh token for loggin in the user
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    //fetching updated user containing refrestToken
    const userDetails = await User.findById(user._id).select("-password -refreshToken")
    console.log(userDetails)

    if (userDetails) {
        const options = {
            HttpOnly: true,
            secure: true
        }
        res.status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { user: userDetails, accessToken, refreshToken },
                    "Tokens generate successfully"
                ))
    }
})

const logoutUser = asyncHandler(async (req, res) => {
    console.log("got user data now loggin him out")
    const userId = req.user._id
    const options = {
        HttpOnly: true,
        secure: true
    }

    const user = await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } }, { new: true })
    console.log(user)

    res.clearCookie('accessToken', options)
    res.clearCookie('refreshToken', options)

    res.status(200).json(new ApiResponse(200, {}, "User successfully logged out"))
})

const refreshTokens = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    if (!decodedToken) throw new ApiError(404, "jwt verification failed due to invalid refresh token")

    const userId = decodedToken._id
    const user = await User.findById(userId)
    if (!user) throw new ApiError(401, "user doesn't exist")
    if (incomingRefreshToken !== user?.refreshToken) throw new ApiError(401, "Refresh token is expired or used")

    const options = {
        HttpOnly: true,
        secure: true
    }
    const { accessToken, refreshToken } = generateAccessAndRefreshToken(userId)
    res.status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(new ApiResponse(200, { accessToken, refreshToken }, "Successfully generated refresh and access tokens"))
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const userId = req.user._id
    const user = await User.findById(userId)

    if (!user) throw new ApiError(401, "User does not exists")

    const correctPassword = await user.isPasswordCorrect(oldPassword)
    if (!correctPassword) throw new ApiError(401, "wrong old password entered")

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    res.status(200).json(200, {}, "password changed successfully")
})

const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json(200, req.user, "User details")
})

const changeUserAvatar = asyncHandler(async (req, res) => {
    const avatarPath = req.file?.path

    if (!avatarPath) throw new ApiError(401, "No file provided")

    const avatar = await uploadOnCloudinary(avatarPath)
    if (!avatar) throw new ApiError(401, "Upload on cloudinary failed")

    //remove previous avatar
    const isDeleted = await deleteFromCloudinary(user.avatar)
    console.log(isDeleted)

    const user = await User.findByIdAndUpdate(req.user._id, { $set: { avatar: avatar.url } }, { $new: true }).select("-password -refreshToken")

    req.status(200).json(new ApiResponse(200, user, "User's avatar successfully changed"))
})

const changeUserCoverImage = asyncHandler(async (req, res) => {
    const coverImagePath = req.file?.path

    if (!coverImagePath) throw new ApiError(401, "No file provided")

    const coverImage = await uploadOnCloudinary(coverImagePath)
    if (!coverImage) throw new ApiError(401, "Upload on cloudinary failed")

    //remove previous avatar
    const isDeleted = await deleteFromCloudinary(user.coverImage)
    console.log(isDeleted)

    const user = await User.findByIdAndUpdate(req.user._id, { $set: { coverImage: coverImage.url } }, { $new: true }).select("-password -refreshToken")

    req.status(200).json(new ApiResponse(200, user, "User's avatar successfully changed"))
})

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        if (!user) throw new ApiError(404, "Invalid UserId")
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        console.log("access token:", accessToken)
        console.log("refresh token:", refreshToken)
        user.refreshToken = refreshToken

        //save the new refreshToken generated in mongo with validation = false so we don't have to send all the validaion fields 
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(404, "Error in generating access Tokens")
    }
}

const getUserChannel = asyncHandler(async (req, res) => {
    const { userName } = req.params

    if (!userName) throw new ApiError(400, "User name empty")

    const channelData = await User.aggregate([
        {
            $match: { userName }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribed"
            }
        },
        {
            $addFields: {
                subscribed: { $size: "$subscribers" },
                subscribedTo: { $size: "$subscribed" },
                isSubscriber: {
                    $cond: {
                        if: { $in: [req.body._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribers: 1,
                subscribed: 1
            }
        }
    ])
    console.log(channel)
    if (!channel?.length) throw new ApiError(400, "aggregation pipeline error")

    res.status(200).json(200, channelData[0], "Subscription details fetched")
})

const getUserWatchHistory = asyncHandler(async (req, res) => {
    const userId = req.body._id

    const user = User.aggregate(
        [
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) },
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            }
                        },
                        {
                            $addFields: { owner: { $first: "$owner" } }
                        }
                    ]
                }
            }
        ]
    )

    res.status(200).json(200, user[0].watchHistory, "User watch history fetched")
})

export { registerUser, loginUser, logoutUser, refreshTokens, changeCurrentPassword, getCurrentUser, changeUserAvatar, changeUserCoverImage, getUserChannel, getUserWatchHistory }