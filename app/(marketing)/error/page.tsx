import Link from "next/link";

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Oops! Something went wrong
          </h2>
          {params.message && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 p-4 rounded-md">
              {params.message}
            </p>
          )}
          <p className="mt-4 text-gray-600">
            Please try again or contact support if the problem persists.
          </p>
        </div>
        <div className="space-x-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Go Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}
