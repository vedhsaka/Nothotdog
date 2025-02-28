'use client'

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function SignupHandler() {
  const { isSignedIn, user } = useUser();

  useEffect(() => {
    async function callSignupAPI() {
      if (isSignedIn && user && user.id) {
        const createdAt = user.createdAt?.getTime();
        const lastSignInAt = user.lastSignInAt?.getTime();
  
        if (createdAt && lastSignInAt) {
          const createdAtSec = Math.floor(createdAt / 1000);
          const lastSignInAtSec = Math.floor(lastSignInAt / 1000);
  
          const isNewUser = createdAtSec === lastSignInAtSec;
  
          if (isNewUser) {
            const payload = {
              clerkId: user.id,
              orgName: user.firstName + `'s organization` || "Default Organization",
              orgDescription: "Default organization",
              role: "admin",
              status: "active",
            };
            try {
              const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const data = await res.json();
            } catch (err) {
              console.error("Failed to call signup API:", err);
            }
          }
        }
      }
    }
    callSignupAPI();
  }, [isSignedIn, user]);
  

  return null;
}
