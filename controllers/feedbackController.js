import Feedback from "../models/Feedback.js";

const addFeedback = async (req, res) => {
    const { name, email, message } = req.body;
    try {
        const feedback = await Feedback.create({
            name: name,
            email: email,
            message: message
        })
        if (feedback) {
            res.status(200).json({ message: "Post added Succesfully" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server error" });
    }

}
const getFeedback = async (req, res) => {
    try {
        const reviews = await Feedback.aggregate([
            {
                $sample: {
                    size: 3
                }
            }
        ]);
        if(reviews){
            return res.status(200).json({reviews:reviews});
        }
    } catch (error) {
        return res.status(500).json({message:"Internal Server error"})
    }

}

export { addFeedback ,getFeedback};