// No auth in this demo (see CLAUDE.md) — every submission is filed under this
// fixed identity so "My submissions" has something to filter by. Production
// would derive this from the SSO session instead.
export const CURRENT_SUBMITTER = "priya.shah@clearpathfinancial.com";

// Same idea for the reviewer role — matches the reviewer identity already
// used throughout src/db/seed-data.ts.
export const CURRENT_REVIEWER = "compliance-analyst@clearpathfinancial.com";
