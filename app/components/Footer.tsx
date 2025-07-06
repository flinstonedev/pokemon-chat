import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <div className="text-center md:text-left">
                            <h3 className="text-lg font-semibold text-gray-900">QuerySculptor Pokemon API Demo</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Showcasing MCP server capabilities with Pokemon data
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
                            <Link
                                href="/terms"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Demo Terms
                            </Link>
                            <Link
                                href="/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Privacy Info
                            </Link>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                            © {new Date().getFullYear()} QuerySculptor Pokemon API Demo. This is a demonstration application not affiliated with Nintendo, Game Freak, or The Pokemon Company.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
} 