import Link from "next/link";

export default function PlumberDashboard({
  displayName,
  jobsThisWeek = 0,
  jobsToday = 0,
  niche = "plumber",
}: {
  displayName: string;
  jobsThisWeek?: number;
  jobsToday?: number;
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
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending Quotes</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">Coming soon</p>
        </div>
        <Link
          href={`/dashboard/${niche}/jobs?date=today`}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block"
        >
          <h3 className="text-sm font-medium text-gray-500">Scheduled Today</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">{jobsToday}</p>
        </Link>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Inventory Alerts</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">Coming soon</p>
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quotes & Invoices
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Create professional quotes for customers. Convert to invoices and
            get paid via PayFast.
          </p>
          <div className="px-4 py-2 bg-gray-100 rounded-md inline-block">
            <span className="text-sm text-gray-500">Coming soon</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inventory Tracking
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Track pipes, fittings, and parts. Get alerts when stock runs low.
          </p>
          <div className="px-4 py-2 bg-gray-100 rounded-md inline-block">
            <span className="text-sm text-gray-500">Coming soon</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Website
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Build and customize your plumbing business website. Showcase your
            services and let customers book online.
          </p>
          <div className="px-4 py-2 bg-gray-100 rounded-md inline-block">
            <span className="text-sm text-gray-500">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
