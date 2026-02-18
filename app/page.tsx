import { HeroAuth } from "@/components/hero-auth";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="h-screen w-full">
      <Suspense fallback={<div>Loading...</div>}>
        <HeroAuth />
      </Suspense>
    </main>
  );
}
