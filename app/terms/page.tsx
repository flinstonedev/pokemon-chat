import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - QuerySculptor Pokemon API Demo",
  description:
    "Terms of Service for QuerySculptor Pokemon API Demo - A demo showcasing QuerySculptor MCP capabilities",
};

export default function TermsOfService() {
  return (
    <div className="flex-1 bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            Terms of Service
          </h1>

          <div className="prose prose-lg max-w-none">
            <div className="mb-6 border-l-4 border-blue-500 bg-blue-50 p-4">
              <p className="font-semibold text-blue-800">
                🚀 This is a demo application! These terms are kept simple since
                this is just a showcase of QuerySculptor MCP server
                capabilities.
              </p>
            </div>

            <p className="mb-6 text-gray-600">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                What is this?
              </h2>
              <p className="mb-4 text-gray-700">
                This is the <strong>QuerySculptor Pokemon API Chat Demo</strong>{" "}
                - a demonstration app that showcases how QuerySculptor&apos;s
                MCP (Model Context Protocol) server works with Pokemon data from
                the GraphQL Pokemon API.
              </p>
              <p className="mb-4 text-gray-700">
                It&apos;s designed to let you chat with an AI assistant that can
                answer questions about Pokemon using advanced GraphQL tools.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                What you can do
              </h2>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>Ask questions about Pokemon (and only Pokemon!)</li>
                <li>See QuerySculptor MCP tools in action</li>
                <li>Experience Assistant UI components</li>
                <li>
                  Test GraphQL API interactions through natural conversation
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Demo limitations
              </h2>
              <p className="mb-4 text-gray-700">
                Since this is a demo, there are some reasonable limits to keep
                things running smoothly:
              </p>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>
                  20 requests per minute per user (that&apos;s plenty for
                  testing!)
                </li>
                <li>Messages limited to 10,000 characters</li>
                <li>
                  Pokemon questions only - the AI will politely decline other
                  topics
                </li>
                <li>You&apos;ll need to sign in with Clerk to try it out</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Please don&apos;t...
              </h2>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>Try to break the demo or overwhelm the servers</li>
                <li>Use it for anything other than testing Pokemon queries</li>
                <li>Share your login credentials</li>
                <li>
                  Expect this to be a production service (it&apos;s just a
                  demo!)
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                How it works
              </h2>
              <p className="mb-4 text-gray-700">The demo uses:</p>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>
                  <strong>QuerySculptor MCP Server:</strong> Provides powerful
                  GraphQL tools to the AI
                </li>
                <li>
                  <strong>Pokemon GraphQL API:</strong> The actual Pokemon data
                  source
                </li>
                <li>
                  <strong>OpenAI GPT:</strong> The AI that chats with you
                </li>
                <li>
                  <strong>Assistant UI:</strong> The chat interface components
                </li>
                <li>
                  <strong>Clerk:</strong> For authentication
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Your data in this demo
              </h2>
              <p className="mb-4 text-gray-700">Since this is a demo:</p>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>
                  Your chat messages are processed by AI models to generate
                  responses
                </li>
                <li>
                  We keep basic info needed for authentication and rate limiting
                </li>
                <li>
                  Don&apos;t share sensitive information in your Pokemon
                  questions
                </li>
                <li>
                  This is a demo environment, not a secure production system
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Pokemon & Trademarks
              </h2>
              <p className="mb-4 text-gray-700">
                Pokemon is a trademark of Nintendo/Game Freak/The Pokemon
                Company. This demo is not affiliated with, endorsed by, or
                sponsored by Nintendo, Game Freak, or The Pokemon Company.
                We&apos;re just using their publicly available API to showcase
                QueryArtisan&apos;s capabilities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Demo disclaimer
              </h2>
              <p className="mb-4 text-gray-700">
                This is a demonstration application provided &quot;as is&quot;
                for testing purposes. While we try to keep it running smoothly,
                we make no guarantees about uptime, accuracy, or availability.
                It&apos;s designed to showcase technology, not provide a
                production service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Changes
              </h2>
              <p className="mb-4 text-gray-700">
                Since this is a demo, we might update these terms as we improve
                the demonstration. We&apos;ll update the date at the top when we
                do.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Questions?
              </h2>
              <p className="mb-4 text-gray-700">
                This is a demo to showcase QuerySculptor MCP server
                capabilities. If you have questions about how it works or want
                to learn more about QuerySculptor, feel free to reach out!
              </p>
            </section>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="border-l-4 border-green-500 bg-green-50 p-4">
                <p className="text-center text-sm text-green-800">
                  🎮 Have fun exploring Pokemon with QuerySculptor! This demo is
                  all about showcasing cool technology.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
