import { v2 as cloudinary } from "cloudinary";
import { unlinkSync } from "fs";

cloudinary.config(
    {
     cloud_name: 'dglldzun3', 
     api_key: '393436182551482', 
     api_secret: 'IzjSS0XFCw2SPVRrBQFObsKIDiA'
    }
)

const uploadOnCloudinary = async (filename)=>{
    try {
        if(!filename) return null
        const response = await cloudinary.uploader.upload(filename,{resource_type:"auto"});
        console.log("file uploaded to cloudinary:",response);
        return response
    } catch (error) {
        unlinkSync(filename)
        console.log("failed to upload to cloudinary",error)
    }
}

export {uploadOnCloudinary}