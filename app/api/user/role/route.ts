import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Patient from '@/models/Patient';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { clerkId, role, email, firstName, lastName } = await request.json();

    // Validate that clerkId exists
    if (!clerkId) {
      return NextResponse.json(
        { error: 'clerkId is required' }, 
        { status: 400 }
      );
    }

    if (role === 'doctor') {
      const safeEmail = email || `${clerkId}@noemail.local`;
      
      // Check if doctor already exists
      const existingDoctor = await Doctor.findOne({ clerkId });
      
      if (existingDoctor) {
        return NextResponse.json({ 
          success: true, 
          message: 'Doctor already exists',
          doctor: existingDoctor 
        });
      }

      // Create new doctor using insertOne to avoid upsert issues
      const doctorData = {
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
        createdAt: new Date(),
      };

      const doctor = new Doctor(doctorData);
      await doctor.save();

      return NextResponse.json({ 
        success: true, 
        message: 'Doctor created successfully',
        doctor 
      });

    } else if (role === 'patient') {
      // Validate email for patients if provided
      const patientEmail = email || '';
      
      // Check if patient already exists
      const existingPatient = await Patient.findOne({ clerkId });
      
      if (existingPatient) {
        return NextResponse.json({ 
          success: true, 
          message: 'Patient already exists',
          patient: existingPatient 
        });
      }

      // Create new patient using insertOne to avoid upsert issues
      const patientData = {
        clerkId,
        name: `${firstName || ''} ${lastName || ''}`.trim() || 'New Patient',
        email: patientEmail,
        createdAt: new Date(),
      };

      const patient = new Patient(patientData);
      await patient.save();

      return NextResponse.json({ 
        success: true, 
        message: 'Patient created successfully',
        patient 
      });
    }

    return NextResponse.json(
      { error: 'Invalid role specified' }, 
      { status: 400 }
    );

  } catch (error) {
    console.error('Error creating user role:', error);
    
    // Handle specific MongoDB errors
    // if (error.code === 11000) {
    //   const duplicateField = Object.keys(error.keyValue || {})[0];
    //   return NextResponse.json(
    //     { error: `Duplicate ${duplicateField}. This ${role} already exists.` },
    //     { status: 409 }
    //   );
    // }

    return NextResponse.json(
      { error: 'Failed to create user role' }, 
      { status: 500 }
    );
  }
}