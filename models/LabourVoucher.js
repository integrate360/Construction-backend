    import mongoose from "mongoose";

    const labourVoucherSchema = new mongoose.Schema(
    {
        voucher: {
        type: String,
        },

        user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        },

        project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        },

        paidAmount: {
        type: Number,
        required: true,
        min: 0,
        },

        paymentMode: {
        type: String,
        enum: ["cash", "bank_transfer", "upi", "cheque"],
        required: true,
        },

        paymentDate: {
        type: Date,
        default: Date.now,
        },

        remarks: {
        type: String,
        trim: true,
        },

        createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        },

        status: {
        type: String,
        enum: ["generated", "paid", "cancelled"],
        default: "paid",
        },
    },
    { timestamps: true },
    );

    const LabourVoucher = mongoose.model("LabourVoucher", labourVoucherSchema);
    export default LabourVoucher;
