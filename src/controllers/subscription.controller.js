import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const {channelId} = req.params
    const userId = req.user._id
    if(!channelId || !userId) throw new ApiError(400,"either userId or channelId is empty")

    const subscriptionData = await Subscription.aggregate([
        {$match:{subscriber:userId,channel:channelId}}
    ])

    if(subscriptionData.length){
        //user is subscribed so remove the subscription
        const unsubscribe = await Subscription.findByIdAndDelete({_id:subscriptionData[0]._id})
        res.status(200).json(new ApiResponse(200,unsubscribe,"user unsubscribed the channel"))
    }
    else{
        //if subscriptionData is null,so user is not subscribed so subscribe the user
        const subscribe = await Subscription.create({subscriber:userId,channel:channelId}) 
        res.status(200).json(new ApiResponse(200,subscribe,"user subscribed the channel"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id
    if(!channelId || !userId) throw new ApiError(400,"channel or userId not present")

    const subscribers = await Subscription.aggregate([
        {$match:{channel:new mongoose.Types.ObjectId(channelId)}},
        {
            $lookup:{
                from:'users',
                localField:'subscriber',
                foreignField:'_id',
                as:'subscriber',
                pipeline:[
                    {
                        $project:{
                            userName:1,
                            fullName:1,
                            email:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscriber:{
                    $first:"$subscriber"
                }
            }
        }
    ])
    console.log(subscribers)
    res.status(200).json(new ApiResponse(200,subscribers,"successfully fetched user's subscribers"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const subscribed = await Subscription.aggregate([
        {$match:{subscriber:new mongoose.Types.ObjectId(subscriberId)}},
        {
            $lookup:{
                from:'users',
                localField:'channel',
                foreignField:'_id',
                as:'subscribed',
                pipeline:[
                    {
                        $project:{
                            userName:1,
                            fullName:1,
                            email:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscribed:{
                    $first:"$subscribed"
                }
            }
        }
    ])
    console.log(subscribed)
    res.status(200).json(new ApiResponse(200,subscribed,"successfully fetched channed user subscribed to"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}