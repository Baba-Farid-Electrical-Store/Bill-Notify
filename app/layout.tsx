import './globals.css';import { ClerkProvider } from '@clerk/nextjs';import {ThemeProvider} from '@/components/theme-provider';import {ServiceWorker} from '@/components/service-worker';
export const metadata={title:'BillNotify',description:'Invoice SMS notifications for Baba Farid Electrical Store',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.png',apple:'/apple-touch-icon.png'}};
export const viewport={themeColor:'#E31E24'};
export default function RootLayout({children}:{children:React.ReactNode}){return <ClerkProvider><html lang="en" suppressHydrationWarning><body><ThemeProvider><ServiceWorker/>{children}</ThemeProvider></body></html></ClerkProvider>}
