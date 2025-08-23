'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import PatientDashboard from '@/components/dashboard/PatientDashboard';
import DoctorDashboard from '@/components/dashboard/DoctorDashboard';
// import LoadingSpinner from '@/components/ui/loading-spinner';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      // const role = user.publicMetadata?.role as string;
      const role = user.unsafeMetadata?.role as string; // Use unsafeMetadata for roles
      if (!role) {
        router.push('/role-selection');
      } else {
        setUserRole(role);
      }
      setLoading(false);
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