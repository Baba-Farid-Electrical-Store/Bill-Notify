import Image from 'next/image';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function Offline() {
  return <main className="offline-page">
    <div className="offline-card">
      <div className="offline-logo"><Image src="/favicon.png" width={40} height={40} alt="" /><span><b>Bill</b>Notify</span></div>
      <div className="offline-icon"><WifiOff size={23} aria-hidden="true" /></div>
      <p className="offline-eyebrow">Connection interrupted</p>
      <h1>You’re offline</h1>
      <p className="muted">Reconnect to see the latest invoices and customer messages.</p>
      <Link className="button" href="/">Try again</Link>
    </div>
  </main>;
}
