import bcrypt from "bcrypt";
import mongoose from "mongoose";

await mongoose.connect("mongodb://localhost:27017/jewelley_walla");
const col = mongoose.connection.db.collection("users");
const hash = await bcrypt.hash("Test@12345", 12);
await col.deleteMany({ email: "kk.test.2026@gmail.com" });
const r = await col.insertOne({
  name: "KK Test User",
  email: "kk.test.2026@gmail.com",
  phone: "9876543210",
  password: hash,
  isVerified: true,
  status: true,
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
});
console.log("created:", r.insertedId);
process.exit(0);
