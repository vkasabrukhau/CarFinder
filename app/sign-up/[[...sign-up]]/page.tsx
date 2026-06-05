import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center p-6">
      <SignUp />
    </main>
  );
}
