import { NewSubmissionForm } from "./NewSubmissionForm";

export default function NewSubmissionPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">New Submission</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Submit ad copy for compliance review.
      </p>
      <div className="mt-6">
        <NewSubmissionForm />
      </div>
    </div>
  );
}
