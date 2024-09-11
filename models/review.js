const mongoose = require("mongoose");
const { schema } = require("./listing");
const Schema = mongoose.Schema;

const reviewSchema = new schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    }
});

module.exports = mongoose.model("Review",reviewSchema);