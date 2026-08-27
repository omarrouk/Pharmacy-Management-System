import mongoose from "mongoose";

export const connectDatabase = async (mongoUri) => {
  await mongoose.connect(mongoUri);
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};

export const getDatabaseHealth = () => ({
  state: mongoose.connection.readyState,
  connected: mongoose.connection.readyState === 1,
});
