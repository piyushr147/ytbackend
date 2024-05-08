import { loginUser, 
    registerUser,
    logoutUser, 
    changeCurrentPassword, 
    getCurrentUser, 
    changeUserAvatar, 
    changeUserCoverImage,
    getUserChannel, 
    getUserWatchHistory,
    refreshTokens} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { Router } from "express";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//verifyJwt is a self-made middleware which can be used at various places for user verification from jwt
router.route("/logout").post(verifyJwt,logoutUser)

router.route("/refresh-token").get(refreshTokens)

router.route("/change-password").post(verifyJwt,changeCurrentPassword)

router.route("/get-user").get(verifyJwt,getCurrentUser)

router.route("/avatar").patch(verifyJwt,upload.single("avatar"),changeUserAvatar)

router.route("/cover-image").patch(verifyJwt,upload.single("coverImage"),changeUserCoverImage)

router.route("/channel/:userName").get(verifyJwt,getUserChannel)

router.route("/history").get(verifyJwt,getUserWatchHistory)

export default router