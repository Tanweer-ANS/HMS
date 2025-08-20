import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { clerkId, role, email, firstName, lastName } = await request.json();

    if (role === 'doctor') {
      const existingDoctor = await Doctor.findOne({ clerkId });
      if (!existingDoctor) {
        await Doctor.create({
          clerkId,
          firstName,
          lastName,
          email,
          specialization: '',
          experience: 0,
          qualification: '',
          contactNumber: '',
          consultationFee: 0,
        });
      }
    } else if (role === 'patient') {
      const existingPatient = await Patient.findOne({ clerkId });
      if (!existingPatient) {
        await Patient.create({
          clerkId,
          firstName,
          lastName,
          email,
          dateOfBirth: new Date(),
          gender: '',
          contactNumber: '',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating user role:', error);
    return NextResponse.json({ error: 'Failed to create user role' }, { status: 500 });
  }
}