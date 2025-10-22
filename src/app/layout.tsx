import './globals.css'
import Script from 'next/script'
import React from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://code.tidio.co/wzdpnxu7gfb2wop0hofuw4acrzmjscsw.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}