import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Patient from '@/models/Patient';
import Appointment from '@/models/Appointment';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Find the patient by clerkId
    const patient = await Patient.findOne({ clerkId: userId });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Fetch appointments for this patient with doctor details
    const appointments = await Appointment.find({ patientId: patient._id })
      .populate('doctorId', 'firstName lastName specialization experience qualification consultationFee rating totalPatients biography availableSlots')
      .sort({ appointmentDate: -1 });

    // Transform the data to match the expected format
    const transformedAppointments = appointments.map(apt => ({
      _id: apt._id,
      doctor: {
        _id: apt.doctorId._id,
        firstName: apt.doctorId.firstName,
        lastName: apt.doctorId.lastName,
        specialization: apt.doctorId.specialization,
        experience: apt.doctorId.experience,
        qualification: apt.doctorId.qualification,
        consultationFee: apt.doctorId.consultationFee,
        rating: apt.doctorId.rating,
        totalPatients: apt.doctorId.totalPatients,
        biography: apt.doctorId.biography,
        availableSlots: apt.doctorId.availableSlots || []
      },
      appointmentDate: apt.appointmentDate,
      appointmentTime: apt.appointmentTime,
      status: apt.status,
      reason: apt.reason,
      consultationFee: apt.consultationFee
    }));

    return NextResponse.json({ appointments: transformedAppointments });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
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
    const updateData = { ...data };

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
      { clerkId: userId },
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