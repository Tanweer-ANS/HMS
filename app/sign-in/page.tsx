"use client";
import { SignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Page() {
  const route = useRouter()
  return (
    <div className="flex justify-center items-center min-h-screen">
      <SignIn />
    </div>
  );
}