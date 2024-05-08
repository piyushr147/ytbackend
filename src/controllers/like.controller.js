
import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id
    //TODO: toggle like on video
    if (!videoId) throw new ApiError(400, "videoId not provided")
    if (!userId) throw new ApiError(400, "empty userId")

    const likeData = await Like.aggregate([
        { $match: { video: videoId, likedBy: userId } },
    ])

    if (likeData.length > 0) {
        //unlike the video
        const unLike = await Like.findByIdAndDelete(likeData[0]?._id)
        console.log("unliked the video", unLike)
        res.status(200).json(new ApiResponse(200, unLike, "unliked the video successfully"))
    }
    else {
        //like the video
        const like = await Like.create({ video: videoId, likedBy: userId })
        if (!like) throw new ApiError(400, "error in liking the video")
        res.status(200).json(new ApiResponse(200, like, "video liked successfully"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const userId = req.user._id
    //TODO: toggle like on comment
    if (!commentId) throw new ApiError(400, "commentId not provided")
    if (!userId) throw new ApiError(400, "empty userId")

    const likeData = await Like.aggregate([
        { $match: { comment: commentId, likedBy: userId } },
    ])

    if (likeData.length > 0) {
        //unlike the video
        const unLike = await Like.findByIdAndDelete(likeData[0]?._id)
        console.log("unliked the comment", unLike)
        res.status(200).json(new ApiResponse(200, unLike, "unliked the comment successfully"))
    }
    else {
        //like the video
        const like = await Like.create({ comment: commentId, likedBy: userId })
        if (!like) throw new ApiError(400, "error in liking the comment")
        res.status(200).json(new ApiResponse(200, like, "comment liked successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.user._id
    //TODO: toggle like on tweet
    if (!tweetId) throw new ApiError(400, "tweetId not provided")
    if (!userId) throw new ApiError(400, "empty userId")

    const likeData = await Like.aggregate([
        { $match: { tweet: tweetId, likedBy: userId } },
    ])

    if (likeData.length > 0) {
        //unlike the video
        const unLike = await Like.findByIdAndDelete(likeData[0]?._id)
        console.log("unliked the tweet", unLike)
        res.status(200).json(new ApiResponse(200, unLike, "unliked the tweet successfully"))
    }
    else {
        //like the video
        const like = await Like.create({ tweet: tweetId, likedBy: userId })
        if (!like) throw new ApiError(400, "error in liking the tweetId")
        res.status(200).json(new ApiResponse(200, like, "tweetId liked successfully"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    const likedVideos = await Like.aggregate([
        { $match: { likedBy: new mongoose.Types.ObjectId(userId), video: { $exists: true } } },
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: 'video',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'owner',
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        email: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            $first: "$owner"
                        }
                    },
                    {
                        $project: {
                            // Filtering video fields.
                            title: 1,
                            videoFile: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            owner: 1,
                        },
                    },
                ]
            },
        },
        {
            $addFields:{
                $first:"$video"
            }
        },
        {

        }
    ])
    console.log(likedVideos)
    likedVideos = likedVideos[0]
    if (!likedVideos) {
        res.status(200).json(200, likedVideos, "no data of users's liked videos")
    }
    res.status(200).json(200, likedVideos, "successfully fetched user's liked videos")
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
