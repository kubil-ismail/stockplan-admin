import { redirect } from "next/navigation";

// Default page: send everyone to the admin; proxy.ts then routes signed-out visitors to /admin/masuk.
export default function Home() {
  redirect("/admin");
}
