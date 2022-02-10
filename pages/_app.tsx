import { AppProps } from 'next/app'
import Head from 'next/head'
import Script from 'next/script'

import '../assets/app.css'

const App = ({ Component, pageProps }: AppProps) => (
  <>
    <Head>
      <meta name="robots" content="noindex, nofollow" />
    </Head>
    <Component {...pageProps} />

    {/* Global site tag (gtag.js) - Google Analytics  */}
    <Script
      src="https://www.googletagmanager.com/gtag/js?id=G-689WM9FP69"
      strategy="afterInteractive"
    />
    <Script id="google-analytics" strategy="afterInteractive">
      {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'GA_MEASUREMENT_ID');
        `}
    </Script>
  </>
)

export default App
