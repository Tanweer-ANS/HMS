import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Patient from '@/models/Patient';

export async function PUT(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    const { clerkId, ...updateData } = data;

    // Calculate age from date of birth if provided
    if (updateData.dateOfBirth) {
      const birthDate = new Date(updateData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        updateData.age = age - 1;
      } else {
        updateData.age = age;
      }
    }

    // Format address as a single string if it's an object
    if (updateData.address && typeof updateData.address === 'object') {
      const { street, city, state, zipCode } = updateData.address;
      updateData.address = [street, city, state, zipCode].filter(Boolean).join(', ');
    }

    // Format phone number
    if (updateData.contactNumber) {
      updateData.phone = updateData.contactNumber;
      delete updateData.contactNumber;
    }

    const updatedPatient = await Patient.findOneAndUpdate(
      { clerkId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, patient: updatedPatient });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    return NextResponse.json({ error: 'Failed to update patient profile' }, { status: 500 });
  }
}