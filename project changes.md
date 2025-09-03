# Update issue: patients not found
_Exported on 9/2/2025 at 22:14:10 GMT+5:30 from Cursor (1.5.9)_

---

**User**

after changes patiens not foud show why updation not work

---

**Cursor**

I'll inspect how patients are fetched and updated by reading `PatientDashboard.tsx`, the patients API route, the patient model, and any related lib functions to pinpoint why "patients not found" occurs after your changes.

I'll scan the related API routes for patients, appointments, doctors, and user-role to trace where "patients not found" might originate and why updates fail.

I'll fix the patient update flow so it creates a record if missing and aligns field mapping, then ensure both related API routes behave consistently.

I'll update the patient profile update route to upsert (create if missing) and keep address nested; then align the PUT in appointments/patient to the same logic to avoid schema mismatches.

```typescript
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
    const updateData = { ...data } as any;

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
```

```typescript
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
      // If no patient profile yet, return empty list for smoother UX
      return NextResponse.json({ appointments: [] });
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
    const updateData = { ...data } as any;

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

    // Keep address as nested object per Patient schema (street/city/state/zipCode)

    // Ensure phone in `phone`
    if (updateData.contactNumber && !updateData.phone) {
      updateData.phone = updateData.contactNumber;
    }

    // Upsert so new patients can be created from this endpoint too
    const updatedPatient = await Patient.findOneAndUpdate(
      { clerkId: userId },
      { $set: { ...updateData }, $setOnInsert: { clerkId: userId } },
      { new: true, runValidators: true, upsert: true }
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
```

- I saw updates started failing with “Patient not found” when a profile doesn’t exist yet. I’ve made the update endpoints create the patient automatically.

What I changed
- patients/profile PUT: now upserts and preserves nested `address` structure.
- appointments/patient PUT: now uses nested `address`, maps `contactNumber` to `phone` if needed, and upserts too.

Why this fixes “patients not found”
- If the patient record was missing, earlier updates returned 404. With upsert, the record is created on first save, so subsequent fetches/updates work.

Try now
- In the Patient Profile tab, click Edit, fill details, Save. If the record didn’t exist, it will be created and shown immediately.
- Booking will still require a completed patient profile; once saved, appointments should list correctly.

- All tasks completed.

---

**User**

fix the terminal error when i choose with health care provisder as a doctor role

---

**Cursor**

I'll check the role selection page, the API for setting user role, and the doctor onboarding/profile routes to identify what's causing the terminal error when choosing the doctor role.

I'll update the role creation and doctor onboarding APIs to upsert records safely and avoid unique/required field errors when selecting the provider role.

```typescript
<<'PATCH'
*** Begin Patch
*** Update File: E:\website\HMS\app\api\user\role\route.ts
@@
-import { NextResponse } from 'next/server';
-import connectDB from '@/lib/mongodb';
-import Doctor from '@/models/Doctor';
-import Patient from '@/models/Patient';
+import { NextResponse } from 'next/server';
+import connectDB from '@/lib/mongodb';
+import Doctor from '@/models/Doctor';
+import Patient from '@/models/Patient';
+
+// Upsert user role into the appropriate collection with safe defaults
 export async function POST(request: Request) {
   try {
     await connectDB();
-    const { clerkId, role, email, firstName, lastName } = await request.json();
+    const { clerkId, role, email, firstName, lastName } = await request.json();
@@
-    if (role === 'doctor') {
-      const existingDoctor = await Doctor.findOne({ clerkId });
-      if (!existingDoctor) {
-        await Doctor.create({
-          clerkId,
-          firstName,
-          lastName,
-          email,
-          specialization: 'General Practice',
-          experience: 0,
-          qualification: 'To be updated',
-          contactNumber: 'Not provided',
-          consultationFee: 0,
-        });
-      }
-    } else if (role === 'patient') {
-      const existingPatient = await Patient.findOne({ clerkId });
-      if (!existingPatient) {
-        await Patient.create({
-          clerkId,
-          firstName,
-          lastName,
-          email,
-          name: `${firstName} ${lastName}`, // Required field
-        });
-      }
-    }
+    if (role === 'doctor') {
+      // Avoid duplicate key errors by using upsert and set-on-insert defaults
+      const safeEmail = email || `${clerkId}@noemail.local`;
+      await Doctor.findOneAndUpdate(
+        { clerkId },
+        {
+          $setOnInsert: {
+            clerkId,
+            firstName: firstName || 'Doctor',
+            lastName: lastName || 'User',
+            email: safeEmail,
+            specialization: 'General Practice',
+            experience: 0,
+            qualification: 'To be updated',
+            contactNumber: 'Not provided',
+            consultationFee: 0,
+            profileCompleted: false,
+            isActive: true,
+          },
+        },
+        { new: true, upsert: true }
+      );
+    } else if (role === 'patient') {
+      await Patient.findOneAndUpdate(
+        { clerkId },
+        {
+          $setOnInsert: {
+            clerkId,
+            name: `${firstName || ''} ${lastName || ''}`.trim() || 'New Patient',
+            email: email || '',
+          },
+        },
+        { new: true, upsert: true }
+      );
+    }
*** End Patch
PATCH
```

```typescript
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
```

```typescript
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
      { $set: { ...updateData, profileCompleted: true, isActive: true } },
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
```

- I’ll prevent the doctor role choice from throwing terminal errors by making creation/updating idempotent and filling required fields safely.

What I changed
- API /api/user/role (POST): switched to upsert.
  - Doctor: uses safe defaults and `email || ${clerkId}@noemail.local`, sets `isActive`, `profileCompleted: false`.
  - Patient: upserts with `name` and `email` defaults.
- API /api/doctor/profile (PUT): upserts, parses numeric fields, sets `profileCompleted: true` and `isActive: true`.

What to do
- Try selecting “I’m a Healthcare Provider” again. It should no longer error and should redirect to onboarding, then dashboard after saving.

- No further tasks pending.

---

**User**

fix the terminal error

---

**Cursor**

I'm going to inspect the updated role API file to verify there isn't a syntax issue and then adjust it to also populate a legacy `clerkUserId` field to satisfy the old unique index and avoid the duplicate key error.

I'll add a legacy `clerkUserId` field to the `Doctor` model and set it during role creation and profile updates to satisfy the existing unique index and stop the duplicate-key error.

```typescript
import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  // Backward-compatibility field for legacy unique index
  clerkUserId: {
    type: String,
    default: null,
    index: true,
    unique: false,
  },
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  experience: {
    type: Number,
    required: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  consultationFee: {
    type: Number,
    required: true,
  },
  availableSlots: [{
    day: String,
    startTime: String,
    endTime: String,
  }],
  biography: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    default: 0,
  },
  totalPatients: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  profileCompleted: { type: Boolean, default: false }
}, {
  timestamps: true,
});

export default mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
```

```typescript
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
```

```typescript
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
```

- I saw the duplicate key error on a legacy unique index for `clerkUserId` being null. I’ve added and populated that field so the index is satisfied.

What I changed
- `models/Doctor.ts`: added optional `clerkUserId` field.
- `/api/user/role` POST: on doctor upsert, now sets `clerkUserId` and uses safe defaults.
- `/api/doctor/profile` PUT: sets `clerkUserId` during upsert.

Try now
- Select the provider role again; the terminal error should be gone.

---

**User**

after click doctor ptrofile coplete don't save

---

**Cursor**

I’m going to update the doctor profile save API to create the doctor record with required fields if it doesn’t exist, using Clerk user info, and ensure the role API sets the legacy `clerkUserId` on creation to avoid index issues.

```typescript
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
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

    // Ensure a doctor doc exists; if not, create one with required fields
    let doctor = await Doctor.findOne({ clerkId: userId });
    if (!doctor) {
      const user = await currentUser();
      const safeEmail = user?.emailAddresses?.[0]?.emailAddress || `${userId}@noemail.local`;
      const firstName = user?.firstName || 'Doctor';
      const lastName = user?.lastName || 'User';

      doctor = new Doctor({
        clerkUserId: userId,
        clerkId: userId,
        firstName,
        lastName,
        email: safeEmail,
        specialization: updateData.specialization || 'General Practice',
        experience: updateData.experience ?? 0,
        qualification: updateData.qualification || 'To be updated',
        contactNumber: updateData.contactNumber || 'Not provided',
        consultationFee: updateData.consultationFee ?? 0,
        availableSlots: updateData.availableSlots || [],
        biography: updateData.biography || '',
        profileCompleted: true,
        isActive: true,
      });
      await doctor.save();
    } else {
      doctor = await Doctor.findOneAndUpdate(
        { clerkId: userId },
        { $set: { ...updateData, profileCompleted: true, isActive: true, clerkUserId: userId } },
        { new: true, runValidators: true }
      );
    }
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, doctor , message: "Doctor is present" });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
```

- Doctor profile wasn’t saving because the doc didn’t exist or required fields blocked the update. I made the save endpoint create the doctor with required defaults if missing and then update it.

What I changed
- `/api/doctor/profile` PUT:
  - If no record exists, it pulls Clerk user data (`email`, name) and creates a valid `Doctor` with sensible defaults, then marks `profileCompleted` and `isActive`.
  - If it exists, it updates and sets `clerkUserId`, `profileCompleted: true`, `isActive: true`.
  - Parses numeric fields safely.

Try now
- Fill the onboarding form and click Complete Profile; it should save and proceed without errors.

---

**User**

doctor profilee update not show in frontend

---

**Cursor**

I'll check how the frontend reads the doctor profile and whether it refreshes after save by inspecting `DoctorDashboard.tsx` and any doctor-profile fetch logic.

I’m going to make the dashboard fetch bypass any caching so it always shows the latest doctor profile right after saving.

```typescriptreact
'use client';

import { useState, useEffect } from 'react';
import { useUser} from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,

  User,
  TrendingUp,
  Users,
  DollarSign,

  CheckCircle,

} from 'lucide-react';
import { motion } from 'framer-motion';

import DoctorOnboarding from "@/app/doctor/onboarding/page";

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  dateOfBirth: string;
  gender: string;
}

interface Appointment {
  _id: string;
  patient: Patient;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason: string;
  symptoms: string[];
  consultationFee: number;
  notes?: string;
  diagnosis?: string;
}

// const specializations = [
//   'Cardiology',
//   'Dermatology',
//   'Gastroenterology',
//   'Neurology',
//   'Orthopedics',
//   'Pediatrics',
//   'Radiology',
//   'Urology',
//   'General Practice'
// ];

export default function DoctorDashboard() {
  const { user } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  // const [formData, setFormData] = useState({
  //   specialization: '',
  //   experience: ''
  // });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, doctorRes] = await Promise.all([
        fetch('/api/appointments/doctor', { cache: 'no-store' }),
        fetch('/api/doctor/profile', { cache: 'no-store' })
      ]);

      const appointmentsData = await appointmentsRes.json();
      const doctorData = await doctorRes.json();

      setAppointments(appointmentsData.appointments || []);
      setDoctorInfo(doctorRes.ok ? (doctorData.doctor || null) : null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toDateString();
    return new Date(apt.appointmentDate).toDateString() === today;
  });

  const upcomingAppointments = appointments.filter(apt =>
    new Date(apt.appointmentDate) >= new Date() && apt.status !== 'Cancelled'
  ).slice(0, 5);

  const completedAppointments = appointments.filter(apt =>
    apt.status === 'Completed'
  );

  const totalRevenue = completedAppointments.reduce((sum, apt) => sum + apt.consultationFee, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* <Heart className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">HealthCare Plus</span> */}
              <span className="text-sm text-gray-500">Doctor&nbsp;Portal</span>
            </div>

            <nav className="hidden md:flex space-x-8">
              {['overview', 'appointments', 'patients', 'analytics', 'profile'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Dr. {user?.firstName}</span>
              {/* <UserButton afterSignOutUrl="/" /> */}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, Dr.&nbsp;{user?.firstName}!
              </h1>
              <p className="text-green-100 text-lg">
                You have {todayAppointments.length} appointments scheduled for today.
              </p>
              {doctorInfo && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {doctorInfo.specialization}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    {doctorInfo.experience} years experience
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>Today</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {todayAppointments.length}
                  </div>
                  <p className="text-gray-600 text-sm">Appointments</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span>Patients</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {doctorInfo?.totalPatients || 0}
                  </div>
                  <p className="text-gray-600 text-sm">Total patients</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span>Completed</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {completedAppointments.length}
                  </div>
                  <p className="text-gray-600 text-sm">This month</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    <span>Revenue</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    ${totalRevenue}
                  </div>
                  <p className="text-gray-600 text-sm">Total earned</p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Today&apos;s Schedule</span>
                    <Badge variant="secondary">{todayAppointments.length} appointments</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {todayAppointments.slice(0, 4).map((appointment) => (
                        <div
                          key={appointment._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {appointment.patient.firstName} {appointment.patient.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{appointment.reason}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.appointmentTime}
                            </div>
                            <Badge className={`mt-1 ${getStatusColor(appointment.status)}`}>
                              {appointment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {todayAppointments.length > 4 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setActiveTab('appointments')}
                        >
                          View All Today&apos;s Appointments
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No appointments scheduled for today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Upcoming Appointments</span>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('appointments')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingAppointments.slice(0, 4).map((appointment) => (
                        <div
                          key={appointment._id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {appointment.patient.firstName} {appointment.patient.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{appointment.reason}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(appointment.appointmentDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600">{appointment.appointmentTime}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No upcoming appointments</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-green-200" onClick={() => setActiveTab('appointments')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span>Manage Appointments</span>
                  </CardTitle>
                  <CardDescription>
                    View, update, and manage your appointment schedule
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200" onClick={() => setActiveTab('patients')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Patient Records</span>
                  </CardTitle>
                  <CardDescription>
                    Access patient information and medical history
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-purple-200" onClick={() => setActiveTab('analytics')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span>Practice Analytics</span>
                  </CardTitle>
                  <CardDescription>
                    View insights and reports about your practice
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'appointments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900">Manage Appointments</h2>

            <div className="space-y-4">
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <Card key={appointment._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {appointment.patient.firstName.charAt(0)}{appointment.patient.lastName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </h4>
                            <p className="text-gray-600">Age: {new Date().getFullYear() - new Date(appointment.patient.dateOfBirth).getFullYear()}, {appointment.patient.gender}</p>
                            <p className="text-sm text-gray-500">{appointment.reason}</p>
                            {appointment.symptoms && appointment.symptoms.length > 0 && (
                              <p className="text-sm text-gray-500">Symptoms: {appointment.symptoms.join(', ')}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </div>
                          <div className="text-gray-600">{appointment.appointmentTime}</div>
                          <Badge className={`mt-2 ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </Badge>
                          <div className="text-sm text-green-600 font-medium mt-1">
                            ${appointment.consultationFee}
                          </div>
                        </div>
                      </div>
                      {(appointment.notes || appointment.diagnosis) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {appointment.diagnosis && (
                            <p className="text-sm"><strong>Diagnosis:</strong> {appointment.diagnosis}</p>
                          )}
                          {appointment.notes && (
                            <p className="text-sm text-gray-600 mt-1"><strong>Notes:</strong> {appointment.notes}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments yet</h3>
                  <p className="text-gray-600">Your appointments will appear here once patients start booking</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {activeTab === "profile" && (
          <DoctorOnboarding />
        )}
      </div>
    </div>
  );
}

interface Doctor {
  specialization?: string;
  experience?: number;
  totalPatients?: number;
  profileCompleted?: boolean;
  // Add other fields as needed
}

export function DoctorProfile() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    async function fetchDoctor() {
      const res = await fetch(`/api/doctor/profile`);
      const data = await res.json();
      setDoctor(data.doctor);
    }
    fetchDoctor();
  }, []);

  if (!doctor) return <div>Loading...</div>;

  return (
    <div>
      {/* ...doctor info... */}
      {doctor.profileCompleted && (
        <span className="text-green-600 font-bold mt-4">Profile Completed</span>
      )}
    </div>
  );
}
```

- The dashboard likely showed stale data. I’ve made it fetch the doctor profile and appointments with no caching so updates appear immediately after saving.

What I changed
- `DoctorDashboard.tsx` `fetchData()` now calls:
  - `fetch('/api/doctor/profile', { cache: 'no-store' })`
  - `fetch('/api/appointments/doctor', { cache: 'no-store' })`
- If the profile endpoint returns an error, the UI won’t try to render stale `doctorInfo`.

Try now
- After completing the doctor profile, go to the dashboard (or switch to the Profile tab and back). The latest specialization/experience should show.

---

**User**

patient now show doctor dashboard

---

**Cursor**

Let me check how the dashboard decides which view (patient vs doctor) to show based on the user's role. I'll read the dashboard page and any role logic.

I'll update the dashboard to verify the role against actual profiles: it will fetch both doctor and patient profiles with no caching and decide which dashboard to render, so patients won’t see the doctor view by mistake.

```typescriptreact
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import PatientDashboard from '@/components/dashboard/PatientDashboard';
import DoctorDashboard from '@/components/dashboard/DoctorDashboard';


export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      const setFromProfiles = async () => {
        try {
          // Always validate with backend state to avoid stale/wrong role
          const [doctorRes, patientRes] = await Promise.all([
            fetch('/api/doctor/profile', { cache: 'no-store' }),
            fetch('/api/patients/profile', { cache: 'no-store' })
          ]);

          if (doctorRes.ok) {
            setUserRole('doctor');
            return;
          }

          const patientJson = await patientRes.json().catch(() => ({}));
          if (patientRes.ok && patientJson && patientJson.patient) {
            setUserRole('patient');
            return;
          }

          // Fallback to Clerk metadata if no profile docs exist yet
          const role = (user.unsafeMetadata?.role as string) || null;
          if (!role) {
            router.push('/role-selection');
          } else {
            setUserRole(role);
          }
        } catch {
          const role = (user.unsafeMetadata?.role as string) || null;
          if (!role) {
            router.push('/role-selection');
          } else {
            setUserRole(role);
          }
        } finally {
          setLoading(false);
        }
      };

      setFromProfiles();
    }
  }, [isLoaded, user, router]);

  if (loading || !isLoaded) {
    return <>
    {/* Loading-spinner */}
    </>;
  }

  if (userRole === 'patient') {
    return <PatientDashboard />;
  }

  if (userRole === 'doctor') {
    return <DoctorDashboard />;
  }

  return <>
  {/* loading spinner */}
  </>;
}
```

- I tightened the dashboard role detection to rely on backend profiles instead of just Clerk metadata, so patients won’t accidentally see the doctor dashboard.

What I changed
- `app/dashboard/page.tsx`:
  - Fetches `/api/doctor/profile` and `/api/patients/profile` with `{ cache: 'no-store' }`.
  - If doctor profile exists (200), shows `DoctorDashboard`.
  - Else if `patient` exists in response, shows `PatientDashboard`.
  - Falls back to Clerk `unsafeMetadata.role` only when neither profile exists, otherwise redirects to `role-selection`.

Try now
- Sign in as a patient and open `/dashboard`. You should see the Patient dashboard.
- If you change roles, make sure the corresponding profile exists; the dashboard uses that as the source of truth.

---

**User**

make doctor profile page show doctor detail on frontend and also edit and save  after complete profile click on 

---

**Cursor**

I'll create a proper doctor profile page that shows the doctor's details and allows editing/saving, similar to how the patient profile works. Let me update the DoctorDashboard to show a proper profile tab instead of just the onboarding form.


```typescriptreact
// ... existing code ...
        {activeTab === "profile" && (
          <DoctorProfile />
        )}
// ... existing code ...
```

Now I'll create a proper DoctorProfile component that shows the doctor's details and allows editing:


```typescriptreact
export function DoctorProfile() {
  const { user } = useUser();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    specialization: '',
    experience: '',
    qualification: '',
    contactNumber: '',
    consultationFee: '',
    biography: '',
    availableSlots: [] as Array<{ day: string; startTime: string; endTime: string }>,
  });

  const specializations = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchDoctor();
  }, []);

  const fetchDoctor = async () => {
    try {
      const res = await fetch('/api/doctor/profile', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.doctor) {
        setDoctor(data.doctor);
        setFormData({
          specialization: data.doctor.specialization || '',
          experience: data.doctor.experience?.toString() || '',
          qualification: data.doctor.qualification || '',
          contactNumber: data.doctor.contactNumber || '',
          consultationFee: data.doctor.consultationFee?.toString() || '',
          biography: data.doctor.biography || '',
          availableSlots: data.doctor.availableSlots || [],
        });
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    const existingSlotIndex = formData.availableSlots.findIndex(slot => slot.day === day);

    if (existingSlotIndex >= 0) {
      const updatedSlots = [...formData.availableSlots];
      updatedSlots[existingSlotIndex] = {
        ...updatedSlots[existingSlotIndex],
        [field]: value,
      };
      setFormData(prev => ({ ...prev, availableSlots: updatedSlots }));
    } else {
      const newSlot = { day, startTime: '', endTime: '', [field]: value };
      setFormData(prev => ({
        ...prev,
        availableSlots: [...prev.availableSlots, newSlot]
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          experience: parseInt(formData.experience) || 0,
          consultationFee: parseInt(formData.consultationFee) || 0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDoctor(result.doctor);
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Refresh the dashboard data
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setMessage(null);
    // Reset form data to current profile
    if (doctor) {
      setFormData({
        specialization: doctor.specialization || '',
        experience: doctor.experience?.toString() || '',
        qualification: doctor.qualification || '',
        contactNumber: doctor.contactNumber || '',
        consultationFee: doctor.consultationFee?.toString() || '',
        biography: doctor.biography || '',
        availableSlots: doctor.availableSlots || [],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Doctor Profile</h2>
          <p className="text-gray-600">Manage your professional information and availability</p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} className="bg-green-600 hover:bg-green-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <p className="text-sm text-gray-900 mt-1">{doctor?.firstName || 'Not provided'}</p>
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <p className="text-sm text-gray-900 mt-1">{doctor?.lastName || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <p className="text-sm text-gray-900 mt-1">{doctor?.email || 'Not provided'}</p>
            </div>

            <div>
              <Label htmlFor="specialization">Specialization</Label>
              {editing ? (
                <Select value={formData.specialization} onValueChange={(value: string) => setFormData({ ...formData, specialization: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map(spec => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900 mt-1">{doctor?.specialization || 'Not provided'}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                {editing ? (
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g., 5"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{doctor?.experience || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="qualification">Qualification</Label>
                {editing ? (
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                    placeholder="e.g., MBBS, MD"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{doctor?.qualification || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactNumber">Contact Number</Label>
                {editing ? (
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{doctor?.contactNumber || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="consultationFee">Consultation Fee (USD)</Label>
                {editing ? (
                  <Input
                    id="consultationFee"
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, consultationFee: e.target.value }))}
                    placeholder="100"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">${doctor?.consultationFee || 'Not provided'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biography */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              <span>Biography</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Textarea
                value={formData.biography}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, biography: e.target.value }))}
                placeholder="Tell patients about yourself, your approach to healthcare, and your experience..."
                rows={6}
              />
            ) : (
              <p className="text-sm text-gray-900">{doctor?.biography || 'No biography provided'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <span>Available Time Slots</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {days.map((day) => {
              const slot = formData.availableSlots.find(s => s.day === day);
              return (
                <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border rounded-lg">
                  <div className="font-medium">{day}</div>
                  <div>
                    {editing ? (
                      <Select
                        value={slot?.startTime || ''}
                        onValueChange={(value: string) => handleSlotChange(day, 'startTime', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-gray-600">{slot?.startTime || 'Not set'}</span>
                    )}
                  </div>
                  <div>
                    {editing ? (
                      <Select
                        value={slot?.endTime || ''}
                        onValueChange={(value: string) => handleSlotChange(day, 'endTime', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-gray-600">{slot?.endTime || 'Not set'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {editing && (
        <div className="flex justify-end space-x-3 pt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
```

I need to update the Doctor interface to include all the fields that are being used. Let me fix this:


```typescriptreact
interface Doctor {
  _id?: string;
  clerkId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  specialization?: string;
  experience?: number;
  qualification?: string;
  contactNumber?: string;
  consultationFee?: number;
  availableSlots?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  biography?: string;
  rating?: number;
  totalPatients?: number;
  profileCompleted?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

I see the issue - the edit was applied incorrectly and reverted the DoctorProfile component. Let me create a separate DoctorProfile component file to avoid conflicts:


```typescriptreact
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Edit, 
  Save, 
  X,
  Stethoscope,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Doctor {
  _id?: string;
  clerkId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  specialization?: string;
  experience?: number;
  qualification?: string;
  contactNumber?: string;
  consultationFee?: number;
  availableSlots?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  biography?: string;
  rating?: number;
  totalPatients?: number;
  profileCompleted?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function DoctorProfile() {
  const { user } = useUser();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    specialization: '',
    experience: '',
    qualification: '',
    contactNumber: '',
    consultationFee: '',
    biography: '',
    availableSlots: [] as Array<{ day: string; startTime: string; endTime: string }>,
  });

  const specializations = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchDoctor();
  }, []);

  const fetchDoctor = async () => {
    try {
      const res = await fetch('/api/doctor/profile', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.doctor) {
        setDoctor(data.doctor);
        setFormData({
          specialization: data.doctor.specialization || '',
          experience: data.doctor.experience?.toString() || '',
          qualification: data.doctor.qualification || '',
          contactNumber: data.doctor.contactNumber || '',
          consultationFee: data.doctor.consultationFee?.toString() || '',
          biography: data.doctor.biography || '',
          availableSlots: data.doctor.availableSlots || [],
        });
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    const existingSlotIndex = formData.availableSlots.findIndex(slot => slot.day === day);

    if (existingSlotIndex >= 0) {
      const updatedSlots = [...formData.availableSlots];
      updatedSlots[existingSlotIndex] = {
        ...updatedSlots[existingSlotIndex],
        [field]: value,
      };
      setFormData(prev => ({ ...prev, availableSlots: updatedSlots }));
    } else {
      const newSlot = { day, startTime: '', endTime: '', [field]: value };
      setFormData(prev => ({
        ...prev,
        availableSlots: [...prev.availableSlots, newSlot]
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          experience: parseInt(formData.experience) || 0,
          consultationFee: parseInt(formData.consultationFee) || 0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDoctor(result.doctor);
        setEditing(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Refresh the dashboard data
        window.location.reload();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setMessage(null);
    // Reset form data to current profile
    if (doctor) {
      setFormData({
        specialization: doctor.specialization || '',
        experience: doctor.experience?.toString() || '',
        qualification: doctor.qualification || '',
        contactNumber: doctor.contactNumber || '',
        consultationFee: doctor.consultationFee?.toString() || '',
        biography: doctor.biography || '',
        availableSlots: doctor.availableSlots || [],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Doctor Profile</h2>
          <p className="text-gray-600">Manage your professional information and availability</p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} className="bg-green-600 hover:bg-green-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-green-600" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <p className="text-sm text-gray-900 mt-1">{doctor?.firstName || 'Not provided'}</p>
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <p className="text-sm text-gray-900 mt-1">{doctor?.lastName || 'Not provided'}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <p className="text-sm text-gray-900 mt-1">{doctor?.email || 'Not provided'}</p>
            </div>

            <div>
              <Label htmlFor="specialization">Specialization</Label>
              {editing ? (
                <Select value={formData.specialization} onValueChange={(value: string) => setFormData({ ...formData, specialization: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map(spec => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-900 mt-1">{doctor?.specialization || 'Not provided'}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                {editing ? (
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g., 5"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{doctor?.experience || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="qualification">Qualification</Label>
                {editing ? (
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                    placeholder="e.g., MBBS, MD"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{doctor?.qualification || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactNumber">Contact Number</Label>
                {editing ? (
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">{doctor?.contactNumber || 'Not provided'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="consultationFee">Consultation Fee (USD)</Label>
                {editing ? (
                  <Input
                    id="consultationFee"
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, consultationFee: e.target.value }))}
                    placeholder="100"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-1">${doctor?.consultationFee || 'Not provided'}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biography */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              <span>Biography</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Textarea
                value={formData.biography}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, biography: e.target.value }))}
                placeholder="Tell patients about yourself, your approach to healthcare, and your experience..."
                rows={6}
              />
            ) : (
              <p className="text-sm text-gray-900">{doctor?.biography || 'No biography provided'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Time Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <span>Available Time Slots</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {days.map((day) => {
              const slot = formData.availableSlots.find(s => s.day === day);
              return (
                <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border rounded-lg">
                  <div className="font-medium">{day}</div>
                  <div>
                    {editing ? (
                      <Select
                        value={slot?.startTime || ''}
                        onValueChange={(value: string) => handleSlotChange(day, 'startTime', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-gray-600">{slot?.startTime || 'Not set'}</span>
                    )}
                  </div>
                  <div>
                    {editing ? (
                      <Select
                        value={slot?.endTime || ''}
                        onValueChange={(value: string) => handleSlotChange(day, 'endTime', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-gray-600">{slot?.endTime || 'Not set'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {editing && (
        <div className="flex justify-end space-x-3 pt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
```

Now I need to update the DoctorDashboard to import and use the new DoctorProfile component:


```typescriptreact
import DoctorOnboarding from "@/app/doctor/onboarding/page";
import DoctorProfile from './DoctorProfile';
```

Perfect! Now I have created a comprehensive doctor profile page. Let me check if there are any linter errors:


Let me check if the files are working correctly by reading them:


Great! Now I have successfully created a comprehensive doctor profile system. Here's what I've implemented:

## ✅ **Doctor Profile System Complete**

### **What I Created:**
1. **New `DoctorProfile.tsx` component** - A full-featured profile page with:
   - **View Mode**: Shows all doctor details (specialization, experience, qualification, contact info, biography, available time slots)
   - **Edit Mode**: Allows editing all fields with proper form controls
   - **Time Slot Management**: Weekly schedule with start/end times for each day
   - **Real-time Updates**: Fetches latest data with no caching

2. **Updated `DoctorDashboard.tsx`** - Now imports and uses the new `DoctorProfile` component

### **Features:**
- **Personal Information**: Name, email, specialization, experience, qualification
- **Contact Details**: Phone number, consultation fee
- **Professional Bio**: Rich text area for doctor description
- **Availability Schedule**: Weekly time slots (Monday-Sunday) with start/end times
- **Edit/Save Functionality**: Toggle between view and edit modes
- **Success/Error Messages**: Clear feedback on save operations
- **Auto-refresh**: Dashboard updates after profile changes

### **How to Use:**
1. **Complete Profile**: After onboarding, click "Complete Profile" to save initial data
2. **View Profile**: Go to Profile tab to see all your information
3. **Edit Profile**: Click "Edit Profile" button to modify any field
4. **Save Changes**: Click "Save Changes" to update your profile
5. **Time Slots**: Set your weekly availability for patients to book appointments

The doctor profile now shows all details on the frontend and allows full editing/saving functionality, just like the patient profile system!

