import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy - QuerySculptor Pokemon API Demo',
    description: 'Privacy Policy for QuerySculptor Pokemon API Demo - How we handle data in this demo',
};

export default function PrivacyPolicy() {
    return (
        <div className="flex-1 py-8 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow-lg rounded-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

                    <div className="prose prose-lg max-w-none">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                            <p className="text-blue-800 font-semibold">
                                🚀 This is a demo app! We keep data handling simple and transparent since this is just showcasing QuerySculptor MCP capabilities.
                            </p>
                        </div>

                        <p className="text-gray-600 mb-6">
                            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What is this demo?</h2>
                            <p className="text-gray-700 mb-4">
                                This is the <strong>QuerySculptor Pokemon API Chat Demo</strong> - a demonstration that shows how QuerySculptor&apos;s MCP server can help AI assistants interact with GraphQL APIs. In this case, we&apos;re using the Pokemon API to let you chat about Pokemon!
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">What we collect (very little!)</h2>

                            <h3 className="text-xl font-semibold text-gray-900 mb-3">When you sign in</h3>
                            <p className="text-gray-700 mb-4">
                                We use Clerk for authentication, so we get:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4">
                                <li>Your basic profile info (email, name if you provide it)</li>
                                <li>A user ID to track your session</li>
                                <li>Authentication details to keep you signed in</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-900 mb-3">When you chat</h3>
                            <ul className="list-disc list-inside text-gray-700 mb-4">
                                <li>Your Pokemon questions (processed but NOT stored by us)</li>
                                <li>When you send messages (for rate limiting - 20 per minute)</li>
                                <li>Your IP address (just for rate limiting and basic security)</li>
                                <li>Basic browser info (helps us make sure the demo works properly)</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">🎯 What we DON&apos;T store</h2>
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                                <p className="text-green-800 font-semibold mb-2">
                                    Important: This demo doesn&apos;t store your conversations!
                                </p>
                                <ul className="list-disc list-inside text-green-700">
                                    <li><strong>Your chat messages:</strong> We don&apos;t save your Pokemon questions or the AI responses</li>
                                    <li><strong>Conversation history:</strong> No chat history is stored in our database</li>
                                    <li><strong>Personal data:</strong> Beyond basic auth info, we don&apos;t store personal information</li>
                                    <li><strong>Usage patterns:</strong> We don&apos;t track what you ask about or build profiles</li>
                                </ul>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How we use your info</h2>
                            <p className="text-gray-700 mb-4">
                                Since this is a demo, we keep it simple:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4">
                                <li>Keep you signed in during your demo session</li>
                                <li>Process your Pokemon questions through the AI (then forget them)</li>
                                <li>Track rate limits so the demo doesn&apos;t get overwhelmed</li>
                                <li>Make sure the QuerySculptor MCP tools work properly</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">The AI and your messages</h2>
                            <p className="text-gray-700 mb-4">
                                Here&apos;s exactly what happens when you ask about Pokemon:
                            </p>
                            <ol className="list-decimal list-inside text-gray-700 mb-4">
                                <li>Your question gets sent to OpenAI&apos;s GPT models</li>
                                <li>The AI uses QuerySculptor MCP tools to query the Pokemon GraphQL API</li>
                                <li>We get back Pokemon data and the AI formats it into a response</li>
                                <li>The response is streamed back to you in real-time</li>
                                <li><strong>That&apos;s it!</strong> No storage, no history, no tracking</li>
                            </ol>
                            <p className="text-gray-700 mb-4">
                                <strong>Remember:</strong> While we don&apos;t store your messages, OpenAI processes them according to their own privacy policy. Don&apos;t share sensitive personal information in your Pokemon questions!
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Who we share info with</h2>
                            <p className="text-gray-700 mb-4">
                                Since this is a demo, we work with these services:
                            </p>

                            <h3 className="text-xl font-semibold text-gray-900 mb-3">The demo tech stack</h3>
                            <ul className="list-disc list-inside text-gray-700 mb-4">
                                <li><strong>Clerk:</strong> Handles your login and authentication</li>
                                <li><strong>OpenAI:</strong> Processes your messages with GPT models (temporarily)</li>
                                <li><strong>Pokemon GraphQL API:</strong> Where we get the Pokemon data</li>
                                <li><strong>Vercel:</strong> Hosts and runs the demo</li>
                            </ul>

                            <p className="text-gray-700 mb-4">
                                Each of these services has their own privacy policies. We only share what&apos;s needed to make the demo work.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How we protect your info</h2>
                            <p className="text-gray-700 mb-4">
                                Even though this is a demo, we still use good security practices:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4">
                                <li>Everything is encrypted in transit (HTTPS)</li>
                                <li>Clerk handles authentication securely</li>
                                <li>Rate limiting prevents spam and abuse</li>
                                <li>We monitor for unusual activity</li>
                                <li>Messages are processed but not stored</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How long we keep info</h2>
                            <p className="text-gray-700 mb-4">
                                Since this is a demo with minimal data storage:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4">
                                <li><strong>Chat messages:</strong> NOT stored at all - processed and discarded</li>
                                <li><strong>Rate limiting data:</strong> Stored in memory only, cleared automatically after 1 hour</li>
                                <li><strong>Account info:</strong> Managed by Clerk, stays until you delete your account</li>
                                <li><strong>Server logs:</strong> Basic logs for debugging, usually cleared after 30 days</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your choices</h2>
                            <p className="text-gray-700 mb-4">
                                You have control over your demo experience:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4">
                                <li>You can sign out anytime</li>
                                <li>You can delete your account through Clerk</li>
                                <li>You can stop using the demo whenever you want</li>
                                <li>Since we don&apos;t store chat history, there&apos;s nothing to delete there!</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-party services</h2>
                            <p className="text-gray-700 mb-4">
                                The demo integrates with these services, each with their own privacy policies:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-4">
                                <li><strong>Clerk:</strong> Authentication and user management</li>
                                <li><strong>OpenAI:</strong> AI model processing (temporary)</li>
                                <li><strong>Pokemon GraphQL API:</strong> Pokemon data source</li>
                                <li><strong>Vercel:</strong> Hosting and deployment</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Kids and the demo</h2>
                            <p className="text-gray-700 mb-4">
                                While Pokemon is popular with kids, this demo is designed for developers and tech enthusiasts to understand MCP capabilities. If you&apos;re under 13, please have a parent or guardian help you try it out.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to this policy</h2>
                            <p className="text-gray-700 mb-4">
                                Since this is a demo, we might update this policy as we improve the demonstration. We&apos;ll update the date at the top when we do. Big changes will be noted in the demo itself.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Questions about the demo?</h2>
                            <p className="text-gray-700 mb-4">
                                This demo is all about showcasing QuerySculptor MCP server capabilities! If you have questions about how it works, what data we use, or want to learn more about QuerySculptor, feel free to reach out.
                            </p>
                        </section>

                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <div className="bg-green-50 border-l-4 border-green-500 p-4">
                                <p className="text-green-800 text-sm text-center">
                                    🎮 Thanks for trying out the QuerySculptor Pokemon API Demo! We hope you enjoy seeing MCP tools in action.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 