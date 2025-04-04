import { Button, Card, CardBody, CardHeader, Input, Link } from "@heroui/react";
import Head from "next/head";

export default function Page() {
  return (
    <>
      <Head>
        <title>Login | DigitalCanvas</title>
        <meta
          name="description"
          content="Login to your DigitalCanvas account"
        />
      </Head>

      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-gray-800">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white mr-2"></div>
              <span className="font-medium text-xl">DigitalCanvas</span>
            </div>
            <Link href="/signup">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-6">
                Sign up
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto px-4">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold mb-6 text-center">
              Welcome Back
            </h1>
            <p className="text-gray-400 mb-8 text-center">
              Log in to your DigitalCanvas account.
            </p>

            <form onSubmit={} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="emma.brown@example.com"
                  className="w-full bg-gray-900 border-gray-700 rounded-md"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  className="w-full bg-gray-900 border-gray-700 rounded-md"
                  required
                />
              </div>

              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="text-gray-400 hover:text-blue-400"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md"
              >
                Log In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Dont have an account?
                <Link
                  href="/signup"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
