import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!videoId) throw new ApiError(400, "videoID not provided")

    const comments = await Comment.aggregate([
        { $match: { video: new mongoose.Schema.ObjectId(videoId) } },
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
            $sort:{createdAt:-1}
        },
        {
            $facet:{
                metadata:[
                    {
                        $count:"totalComments"
                    },
                    {
                        $addFields:{
                            pageNumber:page,
                        }
                    }
                ],
                data:[
                    {
                        $skip:(page-1)*limit
                    },
                    {$limit:limit}
                ]
            }
        },
    ])
    if (!comments) throw new ApiError(400, "error in fetching comments from db")
    console.log(comments)
    comments = comments[0]
    res.status(200).json(new ApiResponse(200, comments, "successfully fetched the comments for user's video"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const video = req.params
    const { content, owner } = req.body
    if (!video) throw new ApiError(400, "videoId is empty")
    if (!content || !owner) throw new ApiError(400, "userId or content not provided ir empty")

    const newComment = await Comment.create({
        content,
        video,
        owner
    })
    if (!newComment) throw new ApiError(400, "comment could not be added for this video")

    res.status(200).json(new ApiResponse(200, newComment, "successfully added the comment on user's video"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const commentId = req.params
    const content = req.body
    if (!commentId || !content) throw new ApiError(400, "commentId or content is emopty or not provided")

    const updatedComment = await Comment.findByIdAndUpdate({ commentId }, { $set: { content } }, { $new: true })
    if (!updatedComment) throw new ApiError(400, "comment was not updated due to some error")

    res.status(200).json(new ApiResponse(200, updatedComment, "successfully updated the comment"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const comment = req.params
    if (!comment) throw new ApiError(400, "commentId is emopty or not provided")

    const deletedComment = await Comment.findByIdAndDelete({ comment })
    if (!deletedComment) throw new ApiError(400, "unable to delete the comment")

    //delete all likes on this comment
    const deleteLikesOfComment = await Like.deleteMany({ comment })

    res.status(200).json(new ApiResponse(200, deleteComment, "successfully delted the comment"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}