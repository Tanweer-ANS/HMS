import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Patient from '@/models/Patient';

export async function PUT(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    const { clerkId, ...updateData } = data;

    const patient = await Patient.findOneAndUpdate(
      { clerkId },
      updateData,
      { new: true }
    );

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, patient });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}