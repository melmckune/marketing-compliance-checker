import { NewSubmissionForm } from "./NewSubmissionForm";

export default function NewSubmissionPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">New Submission</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Submit ad copy for compliance review. The system infers which regulations apply from
        the product type — you don&apos;t need to pick them yourself.
      </p>
      <div className="mt-6">
        <NewSubmissionForm />
      </div>
    </div>
  );
}
