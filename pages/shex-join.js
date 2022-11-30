import Head from 'next/head' // {{{1
import Link from 'next/link';
import Script from 'next/script'
import { useEffect, useState } from 'react'
import styles from './shex-join.module.css'
import { setup, teardown } from '../shex'

const addWallet = opts => // {{{1
<>
  <p>
Hi there, I'm {opts.greeting}. Welcome to Stellar Help Exchange! To join it, 
add Stellar wallet (called Freighter) to your browser, connect it to a 
Stellar network (TESTNET or PUBLIC) and add your account. Then come back and 
reload this page.
  </p>
  <p>
    <a href="https://www.freighter.app/" target="_blank">More Info on Freighter</a>
  </p>
</>

const mobileDevice = opts => // {{{1
<>
  <p>
Hi there, I'm {opts.greeting}. To join Stellar Help Exchange, one would need to add
a wallet to their browser. I honestly tried to help mobile device users do so, but
as of 2022-12-01 you would need a computer to join us. Maybe later...
  </p>
  <p>
    <a href="https://www.freighter.app/" target="_blank">More Info on wallets</a>
  </p>
</>

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

  let greeting = 'Дід Alik'
  
  return ( // {{{2
  <>
    {/* Head {{{3 */}
    <Head> 
      <title>Join Stellar HEX</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
    {/* Script typed.js@2.0.12 {{{3 */}
    <Script
      onError={e => setQ(p => Object.assign({}, p, { error: e }))}
      onLoad={_ => setQ(p => Object.assign({}, p, { event: 'typed-load', }))}
      onReady={_ => setQ(p => Object.assign({}, p, {  event: 'typed-ready', }))}
      src="https://cdn.jsdelivr.net/npm/typed.js@2.0.12"
      strategy="beforeInteractive"
    />
    {/* Script stellar-freighter-api/1.3.1 {{{3 */}
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
      strategy="afterInteractive"
    />

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
      <div>
        {
          q.error ? <code>{JSON.stringify(q)}</code>
          : q.userAgent?.includes('Mobile') ? mobileDevice({
             greeting,
          }) // TODO 1: support mobile devices
          : q.connected ?
            q.user ? 
              q.user.loaded ? 
                <code>{JSON.stringify(q.user.loaded.balances.length)}</code>
              : walletAdded(window.StellarNetwork.id, q.user.keypair.publicKey()) 
            : 'Buy HEXA now!'
          : addWallet({ greeting, })
        }
      </div>
    </div> {/* }}}3 */}
  </>
  ) // }}}2
}
// TODO 1 hint: use https://www.npmjs.com/package/stellar-hd-wallet
