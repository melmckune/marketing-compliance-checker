import { db } from "@/db";
import { SeverityBadge } from "@/components/badges";
import { setPolicyActive } from "./actions";
import { CreatePolicyForm } from "./create-policy-form";
import { RULES } from "@/rules";

// Live operational view — never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const policies = await db.query.policies.findMany({
    orderBy: (policies, { asc }) => [asc(policies.name)],
  });

  const activeCount = policies.filter((p) => p.active).length;

  const engineRuleIds = new Set(RULES.map((r) => r.id));
  const engineBacked = (ruleId: string) => engineRuleIds.has(ruleId);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Compliance Policies</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {activeCount} of {policies.length} rules enforced
        </p>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        All policies the rule engine currently checks, sourced from the engine rule set. Disabling a
        policy stops the engine flagging it on new submissions.
      </p>

      <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">Policy</th>
              <th className="px-4 py-2 font-medium">Regulation</th>
              <th className="px-4 py-2 font-medium">Severity</th>
              <th className="px-4 py-2 font-medium">Applies to</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {policies.map((p) => (
              <tr
                key={p.id}
                className={`align-top ${p.active ? "" : "opacity-60"} hover:bg-slate-50 dark:hover:bg-slate-900/50`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{p.description}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                    {p.ruleId}
                  </p>
                  {!engineBacked(p.ruleId) && (
                    <span
                      className="mt-1 inline-block rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                      title="No matching rule is compiled in the engine yet, so this policy is tracked but not yet enforced by the flagger."
                    >
                      Not wired to engine
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.regulation}</td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={p.severity} />
                </td>
                <td className="px-4 py-3 text-slate-600 capitalize dark:text-slate-300">
                  {p.productScope}
                </td>
                <td className="px-4 py-3">
                  {p.active ? (
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      Disabled
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <ToggleButton policyId={p.id} active={p.active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreatePolicyForm />
    </div>
  );
}

function ToggleButton({ policyId, active }: { policyId: number; active: boolean }) {
  return (
    <form action={setPolicyActive} className="flex justify-end">
      <input type="hidden" name="policyId" value={policyId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <button
        type="submit"
        className={`rounded border px-3 py-1 text-xs font-medium transition-colors ${
          active
            ? "border-slate-300 text-slate-600 hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-800 dark:hover:text-red-400"
            : "border-slate-300 text-slate-600 hover:border-green-300 hover:text-green-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-green-800 dark:hover:text-green-400"
        }`}
      >
        {active ? "Disable" : "Enable"}
      </button>
    </form>
  );
}
