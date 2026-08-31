import { redirect } from "next/navigation";

// No landing page yet — reviewer is the only role built so far. Redirect
// here to /submitter once that side exists and a real root page is needed.
export default function Home() {
  redirect("/reviewer");
}
