'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, MessageSquareText, FileText, Settings as SettingsIcon } from 'lucide-react';

const nav = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/invoices', 'Invoices', ReceiptText],
  ['/messages', 'Messages', MessageSquareText],
  ['/templates', 'Templates', FileText],
  ['/settings', 'Settings', SettingsIcon],
] as const;

export function Nav() {
  const path = usePathname();
  return <>
    <aside className="sidebar">
      <div className="brand brand-lockup"><Image src="/favicon.png" width={35} height={35} alt="" /><span><b>Bill</b>Notify</span></div>
      <nav aria-label="Main navigation">
        {nav.map(([href, label, Icon]) => {
          const active = path === href || (href !== '/' && path.startsWith(href));
          return <Link className={`navlink ${active ? 'active' : ''}`} href={href} key={href} aria-current={active ? 'page' : undefined}>
            <Icon size={18} aria-hidden="true" />{label}
          </Link>;
        })}
      </nav>
    </aside>
    <nav className="mobile-nav" aria-label="Main navigation">
      {nav.map(([href, label, Icon]) => {
        const active = path === href || (href !== '/' && path.startsWith(href));
        return <Link className={active ? 'active' : ''} href={href} key={href} aria-current={active ? 'page' : undefined}>
          <Icon size={19} aria-hidden="true" />{label}
        </Link>;
      })}
    </nav>
  </>;
}
