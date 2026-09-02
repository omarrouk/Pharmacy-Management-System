import mongoose from "mongoose";
import {
  NOTIFICATION_CHANNEL_VALUES,
  NOTIFICATION_STATUS_VALUES,
  NOTIFICATION_TYPE_VALUES,
} from "../../../constants/notifications.js";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: NOTIFICATION_TYPE_VALUES,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: NOTIFICATION_STATUS_VALUES,
      default: "UNREAD",
    },
    channel: {
      type: String,
      required: true,
      enum: NOTIFICATION_CHANNEL_VALUES,
      default: "IN_APP",
    },
    dedupeKey: {
      type: String,
      trim: true,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, dedupeKey: 1, status: 1 });

notificationSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.userId = String(ret.userId);
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Notification = mongoose.model("Notification", notificationSchema);
