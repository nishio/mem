import { AppProps } from 'next/app'
import Head from 'next/head'
import Script from 'next/script'

import '../assets/app.css'

const App = ({ Component, pageProps }: AppProps) => (
  <>
    <Head>
      <link
        id="favicon"
        rel="icon"
        href="https://gyazo.com/03051565f03a70a83b182fda5965e187/max_size/200"
      />
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
