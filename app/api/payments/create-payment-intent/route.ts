import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
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

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(consultationFee * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        patientId: patient._id.toString(),
        doctorId: doctor._id.toString(),
        appointmentDate,
        appointmentTime,
        reason,
        consultationFee: consultationFee.toString(),
      },
      description: `Appointment with Dr. ${doctor.firstName} ${doctor.lastName} on ${appointmentDate} at ${appointmentTime}`,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}
