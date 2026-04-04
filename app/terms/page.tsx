import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import * as motion from "framer-motion/client";

export const metadata: Metadata = {
  title: "Terms of Service | Streakly",
  description: "The terms you agree to when using Streakly.",
};

export default function TermsOfService() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-v-body selection:bg-primary selection:text-primary-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto px-6 py-20"
      >
        <div className="flex items-center justify-between mb-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </Link>
          <Logo className="text-2xl" />
        </div>

        <header className="mb-16">
          <h1 className="text-5xl md:text-7xl font-v-headings mb-4 tracking-tighter">
            Terms <span className="italic opacity-30">of Service.</span>
          </h1>
          <p className="text-muted-foreground">Last Updated: {currentDate}</p>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none space-y-12 text-lg leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              1. Acceptance of Terms
            </h2>
            <p>
              Streakly is a <strong>free and open-source</strong> project built
              for the community. By accessing or using the application, you
              agree to comply with and be bound by these Terms of Service. If
              you do not agree, please do not use the application.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              2. User Accounts
            </h2>
            <p>
              To use Streakly, you must sign in via your Google account. You are
              responsible for maintaining the security of your account and for
              all activities that occur under your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              3. Prohibited Use
            </h2>
            <p>
              You agree not to use Streakly for any illegal or unauthorized
              purpose. You must not, in the use of the Service, violate any laws
              in your jurisdiction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              4. Intellectual Property & Open Source
            </h2>
            <p>
              While Streakly and its original content are the property of its
              creators, the project is provided as{" "}
              <strong>open-source software</strong>. You are encouraged to
              contribute to the project, fork it, or use it according to its
              open-source license.
            </p>
            <p>
              Features and functionality are protected by international
              copyright laws, but our goal is transparency and community-driven
              development.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              5. User Content
            </h2>
            <p>
              You retain all rights to the content you create and store in
              Streakly (goals, notes, etc.). However, you grant us a license to
              store and process this content as necessary to provide our
              services to you.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              6. Disclaimer of Warranties
            </h2>
            <p>
              Streakly is provided "as is" and "as available" without any
              warranty of any kind, either express or implied. We do not
              guarantee that the service will be uninterrupted or error-free.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              7. Limitation of Liability
            </h2>
            <p>
              In no event shall Streakly or its creators be liable for any
              indirect, incidental, special, or consequential damages arising
              out of your use or inability to use the service.
            </p>
          </section>

          <section className="space-y-4 pt-8 border-t border-border/10">
            <h2 className="text-2xl font-bold tracking-tight">8. Contact Us</h2>
            <p>
              For any questions regarding these Terms, please contact us at{" "}
              <a
                href="mailto:tushargsoni17@gmail.com"
                className="underline hover:text-primary transition-colors"
              >
                tushargsoni17@gmail.com
              </a>
              .
            </p>
          </section>
        </article>

        <footer className="mt-20 pt-10 border-t border-border/10 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
            The finish line is just a series of starts.
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
