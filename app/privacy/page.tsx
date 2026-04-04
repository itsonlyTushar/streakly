import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import * as motion from 'framer-motion/client';

export const metadata: Metadata = {
  title: 'Privacy Policy | Streakly',
  description: 'How we handle your data at Streakly.',
};

export default function PrivacyPolicy() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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
            Privacy <span className="italic opacity-30">Policy.</span>
          </h1>
          <p className="text-muted-foreground">Last Updated: {currentDate}</p>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none space-y-12 text-lg leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">1. Overview</h2>
            <p>
              Streakly is designed with a focus on simplicity and privacy. We believe that your data is yours, and we only collect what is necessary to provide you with a seamless goal tracking and revision experience.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">2. Information We Collect</h2>
            <p>
              When you use Streakly, we collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> We use Google Sign-In to authenticate your account. This provides us with your email address and profile name.</li>
              <li><strong>User Content:</strong> Your goals, notes, and revision data are stored securely to allow synchronization across your devices.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">3. How We Use Your Data</h2>
            <p>
              Your data is exclusively used to provide the core services of Streakly:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Manage and synchronize your goals and notes.</li>
              <li>Send you optional email reminders for your revisions.</li>
            </ul>
            <p>
              We do not track your usage, goals, revisions, or any other activity within the app.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">4. Data Storage and Security</h2>
            <p>
              We use industry-standard cloud providers like Firebase to store your data securely. We implement security measures to protect your personal information, though no system is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">5. Your Rights</h2>
            <p>
              You have the right to access, update, or delete your data at any time. Since we only store essential data, you can manage your content directly within the application or by contacting us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">6. Third-Party Services</h2>
            <p>
              We only use two essential third-party services:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google:</strong> For secure authentication and account management.</li>
              <li><strong>Resend:</strong> For sending authenticated email notifications if you have enabled them.</li>
            </ul>
            <p>
              We do not use any tracking scripts, analytics tools (like Google Analytics), or third-party cookies. We do not sell your personal data.
            </p>
          </section>

          <section className="space-y-4 pt-8">
            <h2 className="text-2xl font-bold tracking-tight">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please reach out to us at <a href="mailto:tushargsoni17@gmail.com" className="underline hover:text-primary transition-colors">tushargsoni17@gmail.com</a>.
            </p>
          </section>
        </article>

        <footer className="mt-20 pt-10 border-t border-border/10 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">
            Stay focused. Build habits.
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
