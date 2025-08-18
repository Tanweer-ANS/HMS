import { NextResponse } from "next/server";
import Patient from "@/models/Patient";
import { connectDB } from "@/lib/mongodb";

// GET all patients
export async function GET() {
  await connectDB();
  const patients = await Patient.find({});
  return NextResponse.json(patients);
}

// POST create patient
export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const patient = await Patient.create(body);
  return NextResponse.json(patient, { status: 201 });
}
