import jwt, { decode } from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"

export const verifyJwt = async(req,res,next)=>{//a middleware function that can be reused for user verification by decodeing jwt token

    try {
        console.log("verifying jwt")
        const accessToken = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ","")
    
        console.log(accessToken,process.env.ACCESS_TOKEN_SECRET)
        const decodedToken = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
        if(!decodedToken) throw new ApiError(404,"Wrong or no access token or secret key provided")
        console.log(decodedToken)

        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
        if(!user) throw new ApiError(401,"No such user exists")
        req.user = user

        //next function calls the next middleware function defined in routes
        next()
    } catch (error) {
        throw new ApiError(401,error)
    }
}