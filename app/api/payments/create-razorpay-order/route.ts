import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { razorpay } from '@/lib/razorpay';
import connectDB from '@/lib/mongodb';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { doctorId, appointmentDate, appointmentTime, reason, consultationFee } = await request.json();

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime || !reason || !consultationFee) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the patient
    const patient = await Patient.findOne({ clerkId: userId });
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Find the doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(consultationFee * 100), // Convert to paise (smallest currency unit)
      currency: 'INR',
      receipt: `appointment_${Date.now()}`,
      notes: {
        patientId: patient._id.toString(),
        doctorId: doctor._id.toString(),
        appointmentDate,
        appointmentTime,
        reason,
        consultationFee: consultationFee.toString(),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
