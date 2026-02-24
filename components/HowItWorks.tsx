import Link from "next/link";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Sign Up",
      description:
        "Create your free account in seconds. No credit card required to get started.",
    },
    {
      number: "02",
      title: "Build Your Site",
      description:
        "Choose a template, customize it to match your brand, and add your content with our easy editor.",
    },
    {
      number: "03",
      title: "Get Paid",
      description:
        "Connect PayFast to start accepting payments. Launch your site and grow your business.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Get your business online in three simple steps
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-indigo-200 -translate-x-1/2" />
              )}

              <div className="relative">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-600 rounded-full text-white text-2xl font-bold mb-6 shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all hover:scale-105"
          >
            Start Building Your Site
          </Link>
        </div>
      </div>
    </section>
  );
}
