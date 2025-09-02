import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { clerkId, role, email, firstName, lastName } = await request.json();
  

    if (role === 'doctor') {
      const safeEmail = email || `${clerkId}@noemail.local`;
      await Doctor.findOneAndUpdate(
        { clerkId },
        {
          $setOnInsert: {
            clerkUserId: clerkId,
            clerkId,
            firstName: firstName || 'Doctor',
            lastName: lastName || 'User',
            email: safeEmail,
            specialization: 'General Practice',
            experience: 0,
            qualification: 'To be updated',
            contactNumber: 'Not provided',
            consultationFee: 0,
            profileCompleted: false,
            isActive: true,
          },
        },
        { new: true, upsert: true }
      );
    } else if (role === 'patient') {
      await Patient.findOneAndUpdate(
        { clerkId },
        {
          $setOnInsert: {
            clerkId,
            name: `${firstName || ''} ${lastName || ''}`.trim() || 'New Patient',
            email: email || '',
          },
        },
        { new: true, upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating user role:', error);
    return NextResponse.json({ error: 'Failed to create user role' }, { status: 500 });
  }
}