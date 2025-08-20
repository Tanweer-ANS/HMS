import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import connectDB from "@/lib/mongodb";

export default async function handler(req:any, res:any): Promise<void> {
  await connectDB();
  const { clerkId, firstName, lastName, role, ...rest } = req.body;

  if (role === "doctor") {
    await Doctor.updateOne(
      { clerkId },
      { $set: { firstName, lastName, ...rest } },
      { upsert: true }
    );
  } else if (role === "patient") {
    await Patient.updateOne(
      { clerkId },
      { $set: { firstName, lastName, ...rest } },
      { upsert: true }
    );
  }
  res.status(200).json({ success: true });
}