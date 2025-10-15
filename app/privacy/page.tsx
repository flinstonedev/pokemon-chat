import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - QuerySculptor Pokemon API Demo",
  description:
    "Privacy Policy for QuerySculptor Pokemon API Demo - How we handle data in this demo",
};

export default function PrivacyPolicy() {
  return (
    <div className="flex-1 bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            Privacy Policy
          </h1>

          <div className="prose prose-lg max-w-none">
            <div className="mb-6 border-l-4 border-blue-500 bg-blue-50 p-4">
              <p className="font-semibold text-blue-800">
                🚀 This is a demo app! We keep data handling simple and
                transparent since this is just showcasing QuerySculptor MCP
                capabilities.
              </p>
            </div>

            <p className="mb-6 text-gray-600">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                What is this demo?
              </h2>
              <p className="mb-4 text-gray-700">
                This is the <strong>QuerySculptor Pokemon API Chat Demo</strong>{" "}
                - a demonstration that shows how QuerySculptor&apos;s MCP server
                can help AI assistants interact with GraphQL APIs. In this case,
                we&apos;re using the Pokemon API to let you chat about Pokemon!
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                What we collect (very little!)
              </h2>

              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                When you sign in
              </h3>
              <p className="mb-4 text-gray-700">
                We use Clerk for authentication, so we get:
              </p>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>Your basic profile info (email, name if you provide it)</li>
                <li>A user ID to track your session</li>
                <li>Authentication details to keep you signed in</li>
              </ul>

              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                When you chat
              </h3>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>Your Pokemon questions (processed but NOT stored by us)</li>
                <li>
                  When you send messages (for rate limiting - 20 per minute)
                </li>
                <li>
                  Your IP address (just for rate limiting and basic security)
                </li>
                <li>
                  Basic browser info (helps us make sure the demo works
                  properly)
                </li>
              </ul>

              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Analytics and Session Recording
              </h3>
              <p className="mb-4 text-gray-700">
                With your consent, we may record your chat sessions to improve
                the user experience:
              </p>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>
                  Session recordings help us understand how users interact with
                  the demo
                </li>
                <li>
                  We analyze interaction patterns to improve the interface and
                  functionality
                </li>
                <li>
                  Usage analytics help us identify bugs and optimize performance
                </li>
                <li>
                  <strong>Important:</strong> We do NOT store personal data or
                  identify individual users in these recordings
                </li>
                <li>
                  Recordings are anonymized and used solely for UX improvements
                </li>
                <li>
                  You can opt out of analytics tracking via the cookie consent
                  banner
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                🎯 What we DON&apos;T store
              </h2>
              <div className="mb-4 border-l-4 border-green-500 bg-green-50 p-4">
                <p className="mb-2 font-semibold text-green-800">
                  Important: This demo doesn&apos;t store your conversations!
                </p>
                <ul className="list-inside list-disc text-green-700">
                  <li>
                    <strong>Your chat messages:</strong> We don&apos;t save your
                    Pokemon questions or the AI responses
                  </li>
                  <li>
                    <strong>Conversation history:</strong> No chat history is
                    stored in our database
                  </li>
                  <li>
                    <strong>Personal data:</strong> Session recordings are
                    anonymized and contain no personally identifiable
                    information
                  </li>
                  <li>
                    <strong>User profiles:</strong> We don&apos;t build user
                    profiles or track individual usage patterns across sessions
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                How we use your info
              </h2>
              <p className="mb-4 text-gray-700">
                Since this is a demo, we keep it simple:
              </p>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>Keep you signed in during your demo session</li>
                <li>
                  Process your Pokemon questions through the AI (then forget
                  them)
                </li>
                <li>
                  Track rate limits so the demo doesn&apos;t get overwhelmed
                </li>
                <li>Make sure the QuerySculptor MCP tools work properly</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                The AI and your messages
              </h2>
              <p className="mb-4 text-gray-700">
                Here&apos;s exactly what happens when you ask about Pokemon:
              </p>
              <ol className="mb-4 list-inside list-decimal text-gray-700">
                <li>Your question gets sent to OpenAI&apos;s GPT models</li>
                <li>
                  The AI uses QuerySculptor MCP tools to query the Pokemon
                  GraphQL API
                </li>
                <li>
                  We get back Pokemon data and the AI formats it into a response
                </li>
                <li>The response is streamed back to you in real-time</li>
                <li>
                  <strong>That&apos;s it!</strong> No storage, no history, no
                  tracking
                </li>
              </ol>
              <p className="mb-4 text-gray-700">
                <strong>Remember:</strong> While we don&apos;t store your
                messages, OpenAI processes them according to their own privacy
                policy. Don&apos;t share sensitive personal information in your
                Pokemon questions!
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Who we share info with
              </h2>
              <p className="mb-4 text-gray-700">
                Since this is a demo, we work with these services:
              </p>

              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                The demo tech stack
              </h3>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>
                  <strong>Clerk:</strong> Handles your login and authentication
                </li>
                <li>
                  <strong>OpenAI:</strong> Processes your messages with GPT
                  models (temporarily)
                </li>
                <li>
                  <strong>Pokemon GraphQL API:</strong> Where we get the Pokemon
                  data
                </li>
                <li>
                  <strong>Vercel:</strong> Hosts and runs the demo
                </li>
                <li>
                  <strong>PostHog:</strong> Analytics platform for session
                  recording and usage analytics (only with your consent)
                </li>
              </ul>

              <p className="mb-4 text-gray-700">
                Each of these services has their own privacy policies. We only
                share what&apos;s needed to make the demo work.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                How we protect your info
              </h2>
              <p className="mb-4 text-gray-700">
                Even though this is a demo, we still use good security
                practices:
              </p>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>Everything is encrypted in transit (HTTPS)</li>
                <li>Clerk handles authentication securely</li>
                <li>Rate limiting prevents spam and abuse</li>
                <li>We monitor for unusual activity</li>
                <li>Messages are processed but not stored</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                How long we keep info
              </h2>
              <p className="mb-4 text-gray-700">
                Since this is a demo with minimal data storage:
              </p>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>
                  <strong>Chat messages:</strong> NOT stored at all - processed
                  and discarded
                </li>
                <li>
                  <strong>Rate limiting data:</strong> Stored in memory only,
                  cleared automatically after 1 hour
                </li>
                <li>
                  <strong>Account info:</strong> Managed by Clerk, stays until
                  you delete your account
                </li>
                <li>
                  <strong>Server logs:</strong> Basic logs for debugging,
                  usually cleared after 30 days
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Your choices
              </h2>
              <p className="mb-4 text-gray-700">
                You have control over your demo experience:
              </p>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>
                  <strong>Cookie consent:</strong> You can accept or reject
                  analytics cookies via the banner when you first visit
                </li>
                <li>
                  <strong>Opt-out anytime:</strong> Even after accepting, you
                  can clear your browser cookies to reset your preference
                </li>
                <li>
                  <strong>Sign out:</strong> You can sign out anytime to end
                  your session
                </li>
                <li>
                  <strong>Delete account:</strong> You can delete your account
                  through Clerk
                </li>
                <li>
                  <strong>Stop using:</strong> You can stop using the demo
                  whenever you want
                </li>
                <li>
                  <strong>No chat history:</strong> Since we don&apos;t store
                  chat history, there&apos;s nothing to delete there!
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Third-party services
              </h2>
              <p className="mb-4 text-gray-700">
                The demo integrates with these services, each with their own
                privacy policies:
              </p>
              <ul className="mb-4 list-inside list-disc text-gray-700">
                <li>
                  <strong>Clerk:</strong> Authentication and user management
                </li>
                <li>
                  <strong>OpenAI:</strong> AI model processing (temporary)
                </li>
                <li>
                  <strong>Pokemon GraphQL API:</strong> Pokemon data source
                </li>
                <li>
                  <strong>Vercel:</strong> Hosting and deployment
                </li>
                <li>
                  <strong>PostHog:</strong> Analytics and session recording
                  (only with your consent)
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Kids and the demo
              </h2>
              <p className="mb-4 text-gray-700">
                While Pokemon is popular with kids, this demo is designed for
                developers and tech enthusiasts to understand MCP capabilities.
                If you&apos;re under 13, please have a parent or guardian help
                you try it out.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Changes to this policy
              </h2>
              <p className="mb-4 text-gray-700">
                Since this is a demo, we might update this policy as we improve
                the demonstration. We&apos;ll update the date at the top when we
                do. Big changes will be noted in the demo itself.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                Questions about the demo?
              </h2>
              <p className="mb-4 text-gray-700">
                This demo is all about showcasing QuerySculptor MCP server
                capabilities! If you have questions about how it works, what
                data we use, or want to learn more about QuerySculptor, feel
                free to reach out.
              </p>
            </section>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="border-l-4 border-green-500 bg-green-50 p-4">
                <p className="text-center text-sm text-green-800">
                  🎮 Thanks for trying out the QuerySculptor Pokemon API Demo!
                  We hope you enjoy seeing MCP tools in action.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
