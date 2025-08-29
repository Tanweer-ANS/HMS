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
    
    // Fetch all active doctors
    const doctors = await Doctor.find({ isActive: true })
      .select('firstName lastName specialization experience qualification consultationFee rating totalPatients biography availableSlots')
      .sort({ rating: -1, totalPatients: -1 });

    // Transform the data to match the expected format
    const transformedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialization: doctor.specialization,
      experience: doctor.experience,
      qualification: doctor.qualification,
      consultationFee: doctor.consultationFee,
      rating: doctor.rating,
      totalPatients: doctor.totalPatients,
      biography: doctor.biography,
      availableSlots: doctor.availableSlots || []
    }));

    return NextResponse.json({ doctors: transformedDoctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}
