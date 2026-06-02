// Bundled sample source so a reviewer can try the app in one click without uploading
// anything — embedded as a constant (not read from disk) so it works on any host, and
// survives the free-tier instance restarting with an empty store.

export const SAMPLE_TITLE = "Northwind Robotics — Employee Handbook (sample)";

export const SAMPLE_TEXT = `Northwind Robotics — Employee Handbook (excerpt)

1. About Northwind Robotics
Northwind Robotics was founded in 2019 in Hamburg, Germany. The company builds autonomous
warehouse robots and the fleet-management software that coordinates them. As of January 2026 the
company employs 142 people across three offices: Hamburg (headquarters), Lisbon, and Toronto.

2. Working hours and remote work
The standard working week is 38 hours. Employees may work remotely up to three days per week.
Core collaboration hours, during which everyone is expected to be reachable, are 10:00–15:00 CET.
Fully remote arrangements are possible for engineering roles after a successful six-month probation.

3. Paid time off
Every full-time employee receives 30 days of paid annual leave per calendar year, in addition to
public holidays in their country of residence. Up to 10 unused leave days may be carried over into
the following year and must be used by March 31. Parental leave follows German statutory rules, with
the company topping up pay to 100% for the first 12 weeks.

4. Equipment and expenses
Each new employee receives a laptop and a one-time home-office budget of 800 euros. Software
licenses are approved by the team lead. Travel expenses are reimbursed within 14 days of submitting a
report through the internal Finance portal.

5. Security and data handling
All customer data is classified as Confidential and must never be copied to personal devices.
Two-factor authentication is mandatory for every internal system. Security incidents must be reported
to security@northwind.example within one hour of discovery. The company runs a mandatory security
training every six months.

6. The Apollo fleet platform
Apollo is Northwind's flagship fleet-management platform. It schedules robot tasks, monitors battery
health, and routes robots around obstacles in real time. Apollo supports up to 500 robots per site
and exposes a REST API for integration with third-party warehouse-management systems. A typical
deployment reduces manual picking time by roughly 40%.`;

/** Starter questions shown to first-time users. The last one deliberately has no answer
 *  in the sample, so a reviewer immediately sees the abstention behavior. */
export const SAMPLE_QUESTIONS: { q: string; kind: "grounded" | "abstains" }[] = [
  { q: "How many days of paid annual leave do employees get?", kind: "grounded" },
  { q: "What does the Apollo platform do?", kind: "grounded" },
  { q: "What is Northwind's annual revenue?", kind: "abstains" },
];
