import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Like } from "../models/like.model.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    if (!userId) throw new ApiError(400, "userId not provided")

    const videos = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        { $match: { isPublished: true } },
        { $sort: { sortType } },
        {
            $facet: {
                metadata: [
                    {
                        $count: "totalVideos"
                    },
                    {
                        $addFields: {
                            pageNumber: page,
                            totalPages: { $ceil: { $divide: ["$totalVideos", limit] } }
                        }
                    }
                ],
                data: [
                    {
                        $skip: (page - 1) * limit
                    },
                    {
                        $limit: limit
                    }
                ]
            }
        },
        {
            $addFields:{
                metadata:{
                    $first:"$metadata"
                }
            }
        }
    ])
    
    if(!videos) throw new ApiError(400,"didn't find any videos")

    res.status(200).json(new ApiResponse(200,videos,"successfully fetched user's videos"))

})

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished = "true" } = req.body
    const userId = req.user._id
    // TODO: get video, upload to cloudinary, create video

    if (!thumbnail) throw new ApiError(400, "empty thumbnail provided")
    if (!title) throw new ApiError(400, "empty title provided")
    if (!description) throw new ApiError(400, "empty description provided")
    if (!duration) throw new ApiError(400, "empty duration provided")

    const videoPath = req.files?.videoFile[0]?.path
    const thumbnailPath = req.files?.thumbnail[0]?.path

    const video = await uploadOnCloudinary(videoPath)
    if (!video) throw new ApiError(400, "error in uploading video to cloudinary")

    const thumbnail = await uploadOnCloudinary(thumbnailPath)
    if (!thumbnail) throw new ApiError(400, "error in uploading thumbnail to cloudinary")

    const duration = Math.round(Number(video.duration))

    const videoData = await Video.create({
        video,
        thumbnail,
        title,
        description,
        duration,
        isPublished,
        owner: userId
    })
    console.log(videoData)
    if (!videoData) throw new ApiError(400, "error in creating entry for video")

    res.status(200).json(new ApiResponse(200, videoData, "successfully created entry for new video published by user"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId) throw new ApiError(400, "videoId not provided")

    //check if video exists
    const videoExists = await Video.findById({ videoId })
    if (!videoExists) throw new ApiError(400, "video to be updated has been deleted by the owner")


    const videoData = await Video.findByIdAndUpdate(
        { videoId },
        { $inc: { views: 1 } },
        { new: 1 }
    )
    if (!videoData) throw new ApiError(400, "error in getting the video requested by the user")

    res.status(200).json(new ApiResponse(200, videoData, "successfully fetched video requested by the user"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description, thumbnail } = req.body
    const userId = req.user._id
    //TODO: update video details like title, description, thumbnail
    if (!videoId) throw new ApiError(400, "videoId not provided")

    //check if video exists and user is requested to update the video(owner)
    const videoExists = await Video.findById({ videoId })
    if (!videoExists) throw new ApiError(400, "video to be updated has been deleted by the owner")

    //check if user is the owner
    if (videoExists.owner !== userId) throw new ApiError(400, "you are not the owner so you don't have the permission to change video")

    const updatedVideo = await Video.findByIdAndUpdate(
        { videoId },
        { $set: { title: 1, description: 1 } },
        { new: true }
    )
    if (!updatedVideo) throw new ApiError("updation of the video has failed")

    res.status(200).json(new ApiResponse(200, updatedVideo, "successfully update user's video data"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!videoId) throw new ApiError(400, "videoId not provided")

    const deletedVideo = await Video.deleteOne({ videoId })
    if (!deletedVideo) throw new ApiError(400, "video already deleted")

    //delete comments of this video
    const deleteCommentsOfVideo = await Comment.deleteMany({ video: videoId })
    //delete likes of this video
    const deleteLikesOfVideo = await Like.deleteMany({ video: videoId })
    //delete video from playlist

    res.status(200).json(new ApiResponse(200, deletedVideo, "successfully deleted the video"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) throw new ApiError(400, "videoId not provided")

    const status = await Video.findByIdAndUpdate(
        { videoId },
        {
            $set: {
                isPublished: {
                    $cond: {
                        if: {
                            $eq: [
                                "$isPublished",
                                true
                            ]
                        },
                        then: false,
                        else: true
                    }
                }
            }
        }
    )
    if (!status) throw new ApiError(400, "error in toggling the publish status")

    res.status(200).json(new ApiResponse(200, status, "successfully toggled the published status"))
})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}