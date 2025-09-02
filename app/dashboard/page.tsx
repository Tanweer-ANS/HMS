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