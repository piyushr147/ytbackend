import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { faTentArrowDownToLine } from "@fortawesome/free-solid-svg-icons"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content, user } = req.body
    if (!content || !user) throw new ApiError(401, "tweet or user is empty")

    const tweet = await Tweet.create({ content, owner: user._id })
    if (!tweet) throw new ApiError(401, "error in uploading your tweet")

    res.status(200).json(new ApiResponse(
        200,
        tweet,
        "successfully published users tweet"
    ))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    if (!userId) throw new ApiError(401, "no userId provided")

    const tweets = await Tweet.findById({ owner: userId })
    if (!tweets) throw new ApiError(401, "no tweets from user")

    res.status(200).json(new ApiResponse(200, tweets, "successfully fetched user's tweets"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO update tweet
    const { tweetId } = req.params
    const { content } = req.body
    if (!tweetId) throw new ApiError(401, "no tweet to be updated provided")

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, { $set: { content } }, { $new: true })
    if (!updatedTweet) throw new ApiError(401, "no tweets from user")

    res.status(200).json(new ApiResponse(200, updatedTweet, "successfully fetched user's tweets"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const tweetId = req.params
    if (!tweetId) throw new ApiError(401, "no tweet to be delted provided")

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    if (!deletedTweet) throw new ApiError(401, "error in deleting the tweet")

    //delete all the likes for this tweet
    const deleteLikesOfTweer = await Like.deleteMany({ tweet: tweetId })
    console.log(deleteLikes)

    res.status(200).json(new ApiResponse(200, deletedTweet, "successfully deleted user's tweets and likes for that tweet"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}