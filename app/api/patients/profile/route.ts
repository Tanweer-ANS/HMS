import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Patient from '@/models/Patient';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const patient = await Patient.findOne({ clerkId: userId });

    if (!patient) {
      // Return empty profile instead of 404 for smoother UX
      return NextResponse.json({ patient: null });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();
    const updateData: Record<string, unknown> = { ...data };

    // Calculate age from date of birth if provided
    const dob = updateData["dateOfBirth"] as string | undefined;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        (updateData as Record<string, unknown>)["age"] = age - 1;
      } else {
        (updateData as Record<string, unknown>)["age"] = age;
      }
    }

    // Ensure phone comes through as-is; frontend already sends `phone`
    // Keep address as nested object per schema
    // Upsert so that a missing patient record is created on first save
    const patient = await Patient.findOneAndUpdate(
      { clerkId: userId },
      { $set: { ...updateData }, $setOnInsert: { clerkId: userId } },
      { new: true, runValidators: true, upsert: true }
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