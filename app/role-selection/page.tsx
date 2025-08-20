
"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user } = useUser();

  async function handleRoleSelect(role: string) {
    // router.push(`/dashboard?${role}`);
    if (user) {
      await user.update({
        // publicMetadata: { role },
        unsafeMetadata: { role },
      });
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-blue-700">Select Your Role</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <button
          className="px-8 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 focus:outline-none transition"
          onClick={() => handleRoleSelect("doctor")}
        >
          Doctor
        </button>
        
        <button
          className="px-8 py-3 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 focus:outline-none transition"
          onClick={() => handleRoleSelect("patient")}
        >
          Patient
        </button>
      </div>
    </div>
  );
}
