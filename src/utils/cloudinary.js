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
        unlinkSync(filename)
        return response
    } catch (error) {
        unlinkSync(filename)
        console.log("failed to upload to cloudinary",error)
    }
}

const deleteFromCloudinary = async(filename)=>{
    try {
        if(!filename) return null
        const resposne = await cloudinary.uploader.destroy(filename)
    } catch (error) {
        
    }
}

export {uploadOnCloudinary}