import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        console.log(process.env.PORT);
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(connectionInstance.connection.host)
    } catch (error) {
        console.log(`Error in connection to Mongoose:${error}`)
        process.exit
    }
}

export default connectDB