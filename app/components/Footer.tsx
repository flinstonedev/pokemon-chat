import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold text-gray-900">
                QuerySculptor Pokemon API Demo
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Showcasing MCP server capabilities with Pokemon data
              </p>
            </div>

            <div className="flex flex-col items-center space-y-2 md:flex-row md:space-y-0 md:space-x-6">
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 transition-colors hover:text-gray-900"
              >
                Demo Terms
              </Link>
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 transition-colors hover:text-gray-900"
              >
                Privacy Info
              </Link>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="text-center text-xs text-gray-500">
              © {new Date().getFullYear()} QuerySculptor Pokemon API Demo. This
              is a demonstration application not affiliated with Nintendo, Game
              Freak, or The Pokemon Company.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
