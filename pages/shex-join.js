import Head from 'next/head' // {{{1
import Link from 'next/link';
import Script from 'next/script'
import { useEffect, useState } from 'react'
import styles from './index.module.css'
import { setup, teardown } from '../shex'

const addWallet = // {{{1
<div>
  Add{' '}<a href="https://www.freighter.app/" target="_blank">Freighter</a>{' '}
  to your browser, set it up and add an account. Then come back and reload this page.
</div>

function walletAdded (network, account) { // {{{1
  return (
<div>
  <code>
    Connected to {network} account {account}.
  </code>
</div>
  );
}

export default function Join() { // {{{1
  const [q, setQ] = useState({}) // {{{2
  useEffect(_ => setQ(p => Object.assign({}, p, {
    connected: window.freighterApi?.isConnected(),
    userAgent: window.navigator.userAgent,
  })), [q.connected, q.userAgent])
  useEffect(_ => {
    console.log(q)
    setup(q, setQ)
    /* return _ => teardown(q, setQ); */
  }, [q.connected, q.event])
  
  return ( // {{{2
  <>
    {/* Head {{{3 */}
    <Head> 
      <title>Join Stellar HEX</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    {/* Script stellar-freighter-api/1.3.1 {{{3 
    <Script
      onError={e => setQ(p => Object.assign({}, p, { error: e }))}
      onLoad={_ => window.freighterApi && !q.connected && setQ(p => 
        Object.assign({}, p, {
          connected: window.freighterApi.isConnected(), event: 'fapi-load',
        }))
      }
      onReady={_ => window.freighterApi && !q.connected && setQ(p =>
        Object.assign({}, p, { 
          connected: window.freighterApi.isConnected(), event: 'fapi-ready', 
        }))
      }
      src="https://cdnjs.cloudflare.com/ajax/libs/stellar-freighter-api/1.3.1/index.min.js"
      strategy="lazyOnload"
    />
    */}

    {/* Script stellar-sdk/10.4.0 {{{3 */}
    <Script
      onError={e => setQ(p => Object.assign({}, p, { error: e }))}
      onLoad={_ => window.StellarSdk &&
        setQ(p => Object.assign({}, p, { event: 'sdk-load', }))
      }
      onReady={_ => window.StellarSdk &&
        setQ(p => Object.assign({}, p, { event: 'sdk-ready', }))
      }
      src="https://cdnjs.cloudflare.com/ajax/libs/stellar-sdk/10.4.0/stellar-sdk.js"
      strategy="lazyOnload"
    />

    <div className={styles.container}> {/* {{{3 */}
      <div className={styles.title}>
        {
          q.error ? <code>{JSON.stringify(q)}</code>
          : q.userAgent?.includes('Mobile') ? 'Unsupported mobile device' // TODO 1: support
          : q.connected ?
            q.user ? 
              q.user.loaded ? 
                <code>{JSON.stringify(q.user.loaded.balances.length)}</code>
              : walletAdded(window.StellarNetwork.id, q.user.keypair.publicKey()) 
            : 'OK'
          : addWallet
        }
      </div>
    </div> {/* }}}3 */}
  </>
  ) // }}}2
}
// TODO 1 hint: use https://www.npmjs.com/package/stellar-hd-wallet
