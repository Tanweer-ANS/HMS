import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const doctor = await Doctor.findOne({ clerkId: userId });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
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
    const updateData = { ...data } as any;

    // Parse numeric fields defensively
    if (typeof updateData.experience === 'string') {
      updateData.experience = parseInt(updateData.experience, 10) || 0;
    }
    if (typeof updateData.consultationFee === 'string') {
      updateData.consultationFee = parseInt(updateData.consultationFee, 10) || 0;
    }

    // Upsert to ensure doctor doc exists after role selection
    const doctor = await Doctor.findOneAndUpdate(
      { clerkId: userId },
      { $set: { ...updateData, profileCompleted: true, isActive: true, clerkUserId: userId } },
      { new: true, upsert: true, runValidators: true }
    );
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, doctor , message: "Doctor is present" });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}