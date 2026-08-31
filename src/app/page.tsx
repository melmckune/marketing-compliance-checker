import { redirect } from "next/navigation";

// No dedicated landing page — reviewer is just the default starting point.
// The header's role switcher (see components/role-switcher.tsx) is what
// actually lets you flip between reviewer and submitter from here.
export default function Home() {
  redirect("/reviewer");
}
