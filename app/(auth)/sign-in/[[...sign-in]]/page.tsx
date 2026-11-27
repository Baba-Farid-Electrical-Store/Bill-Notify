import Image from 'next/image';
import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return <main className="auth-page">
    <section className="auth-panel">
      <div className="auth-brand"><Image src="/favicon.png" width={42} height={42} alt="" /><span><b>Bill</b>Notify</span></div>
      <p className="auth-eyebrow">Baba Farid Electrical Store</p>
      <h1>Welcome back</h1>
      <p className="auth-description">Sign in to manage invoice updates and customer messages.</p>
      <SignIn appearance={{ elements: { card: 'auth-clerk-card', headerTitle: 'auth-clerk-title', headerSubtitle: 'auth-clerk-subtitle' } }} />
    </section>
    <aside className="auth-aside"><span className="auth-aside-mark">“</span><p>Keep every customer in the loop, from invoice to delivery.</p><span>INVOICE COMMUNICATIONS</span></aside>
  </main>;
}
