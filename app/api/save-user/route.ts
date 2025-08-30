import Doctor from "@/models/Doctor";
import Patient from "@/models/Patient";
import connectDB from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { clerkId, firstName, lastName, role, ...rest } = body;

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
  return NextResponse.json({ success: true });
}