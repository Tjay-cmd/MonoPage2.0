import Link from "next/link";

export default function PlumberDashboard({
  displayName,
  jobsThisWeek = 0,
  jobsToday = 0,
  pendingQuotes = 0,
  techniciansCount = 0,
  paidThisMonth = 0,
  outstanding = 0,
  unpaidInvoicesCount = 0,
  niche = "plumber",
}: {
  displayName: string;
  jobsThisWeek?: number;
  jobsToday?: number;
  pendingQuotes?: number;
  techniciansCount?: number;
  paidThisMonth?: number;
  outstanding?: number;
  unpaidInvoicesCount?: number;
  niche?: string;
}) {
  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {displayName}
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your plumbing business from one place
        </p>
      </div>

      {/* Quick stats / placeholder cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={`/dashboard/${niche}/jobs?date=week`}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block"
        >
          <h3 className="text-sm font-medium text-gray-500">Jobs This Week</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">{jobsThisWeek}</p>
        </Link>
        <Link
          href={`/dashboard/${niche}/quotes?status=new`}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block"
        >
          <h3 className="text-sm font-medium text-gray-500">Pending Quotes</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">{pendingQuotes}</p>
        </Link>
        <Link
          href={`/dashboard/${niche}/jobs?date=today`}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block"
        >
          <h3 className="text-sm font-medium text-gray-500">Scheduled Today</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">{jobsToday}</p>
        </Link>
        <Link
          href={`/dashboard/${niche}/jobs`}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block"
        >
          <h3 className="text-sm font-medium text-gray-500">Technicians</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">{techniciansCount}</p>
        </Link>
      </div>

      {/* Revenue overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Paid this month</h3>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              R{paidThisMonth.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400 mt-1">Auto-updated when PayFast payment succeeds</p>
          </div>
          <Link
            href={`/dashboard/${niche}/quotes?tab=invoices`}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block"
          >
            <h3 className="text-sm font-medium text-gray-500">Outstanding</h3>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              R{outstanding.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {unpaidInvoicesCount} unpaid invoice{unpaidInvoicesCount !== 1 ? "s" : ""}
            </p>
          </Link>
        </div>
      </div>

      {/* Feature sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Link
          href={`/dashboard/${niche}/jobs`}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Job Scheduling
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Schedule and manage your plumbing jobs. Assign technicians and track
            job status.
          </p>
          <span className="text-sm text-indigo-600 font-medium">
            Go to Jobs →
          </span>
        </Link>
        <Link
          href={`/dashboard/${niche}/quotes`}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quotes & Invoices
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Create professional quotes for customers. Convert to invoices and
            get paid via PayFast.
          </p>
          <span className="text-sm text-indigo-600 font-medium">
            Go to Quotes & Invoices →
          </span>
        </Link>
        <Link
          href={`/dashboard/${niche}/website`}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Website
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Build and customize your plumbing business website. Showcase your
            services and let customers book online.
          </p>
          <span className="text-sm text-indigo-600 font-medium">
            Go to Website →
          </span>
        </Link>
      </div>
    </div>
  );
}
