import connectDB from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      clerkId,
      specialization,
      experience,
      qualification,
      contactNumber,
      consultationFee,
      biography,
      availableSlots,
    } = body;

    if (
      !clerkId ||
      !specialization ||
      !experience ||
      !qualification ||
      !contactNumber ||
      !consultationFee
    ) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const doctorData = {
        clerkUserId: clerkId,
        specialization,
        experience,
        qualification,
        contactNumber,
        consultationFee,
        biography,
        availableSlots,
      };

      const doctor = await Doctor.findOneAndUpdate(
        { clerkUserId: clerkId },
        doctorData,
        { upsert: true, new: true }
      );

      return new Response(JSON.stringify({ success: true, doctor }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Error saving doctor profile:", error);
      return new Response(JSON.stringify({ message: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ message: "Unexpected error", error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}