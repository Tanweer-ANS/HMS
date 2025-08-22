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
          specialization: 'General Practice',
          experience: 0,
          qualification: 'To be updated',
          contactNumber: 'Not provided',
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
          name: `${firstName} ${lastName}`, // Required field
          dateOfBirth: new Date(),
          age: 0, // Required field - default to 0
          gender: 'Other', // Required field - using valid enum value
          phone: 'Not provided', // Required field - placeholder value
          address: 'Not provided', // Required field - placeholder value
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating user role:', error);
    return NextResponse.json({ error: 'Failed to create user role' }, { status: 500 });
  }
}