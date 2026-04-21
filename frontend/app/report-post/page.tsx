import { Suspense } from "react";
import ReportPost from "../components/ReportPost";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReportPost />
    </Suspense>
  );
}
