import { SignIn } from "@clerk/nextjs";
const page = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}

export default page
