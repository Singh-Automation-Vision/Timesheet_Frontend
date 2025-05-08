import Link from "next/link"

export default function About() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">About This Project</h1>
      <p className="text-xl mb-8 max-w-2xl text-center">
        This is a Next.js project template optimized for deployment on Netlify. It includes all the necessary
        configurations to ensure smooth deployment.
      </p>

      <div className="p-6 bg-gray-50 rounded-lg max-w-4xl mb-8">
        <h2 className="text-2xl font-semibold mb-3">Configuration Details</h2>
        <ul className="list-disc list-inside mt-2 space-y-2">
          <li>_redirects file in public folder for proper routing</li>
          <li>netlify.toml with plugin configuration</li>
          <li>Optimized build settings</li>
          <li>App Router configuration</li>
        </ul>
      </div>

      <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
        Back to Home
      </Link>
    </main>
  )
}
