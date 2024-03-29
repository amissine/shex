import Head from 'next/head' // {{{1
import Link from 'next/link';
import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import styles from './shex-join.module.css'
import { buyHEXA, setup, teardown, watchMakes, } from '../shex'

let greeting = 'Дід Alik' // {{{1
  
const addWallet = opts => // {{{1
<>
  <div id="typed-string">
    <p>
Hi there, I'm {greeting}. I am here to help you join Stellar HEX.
    </p>
  </div>
  <div className={styles.typedwrap}>
    <span style={{ whiteSpace: 'pre' }} ref={opts.el} />
  </div>
  <p id='contextual-prompt' style={{ display: 'none' }}>
Welcome to Stellar Help Exchange! To join it, 
add Stellar wallet (called {' '}
  <a href="https://www.freighter.app/" target="_blank">Freighter</a>
) to your browser, connect it to a 
Stellar network (TESTNET or PUBLIC) and add your account to it. To start with,
create a new account on TESTNET and fund it with Friendbot. Then come back and 
reload this page.
  </p>
</>

const dispatch = opts => { // {{{1
  switch (opts.q.event) {
    case 'buyHEXA-started':
    case 'watchMakes-started':
      document.getElementById('contextual-prompt').style.display = 'none'
      return typedPrompt('Work In Progress...', opts.el, 'Stay tuned!');
  }
  document.getElementById('contextual-prompt').style.display = 'block'
  return typedPrompt(
    '*** UNEXPECTED EVENT ***', opts.el, `UNEXPECTED EVENT: ${opts.q.event}`
  );
}

const mobileDevice = opts => // {{{1
<>
  <div id="typed-string">
    <p>Hi there, I'm {greeting}. Bad news, sorry.</p>
  </div>
  <div className={styles.typedwrap}>
    <span style={{ whiteSpace: 'pre' }} ref={opts.el} />
  </div>
  <p id='contextual-prompt' style={{ display: 'none' }}>
To join Stellar Help Exchange, one would need to add
a wallet to their browser. I honestly tried to help mobile device users do so, but
as of 2022-12-01 you would need a computer to join us. Maybe later...
  </p>
  <p id='more-info-on-wallets' style={{ display: 'none' }}>
    <a href="https://www.freighter.app/" target="_blank">More Info on wallets</a>
  </p>
</>

const userLoaded = opts => {// {{{1
  return (
<>
  <div id="typed-string">
    <p>
Your account is now loaded. You can make / take Stellar HEX offers / requests!
    </p>
  </div>
  <div className={styles.typedwrap}>
    <span style={{ whiteSpace: 'pre' }} ref={opts.el} />
  </div>
  <p id='contextual-prompt' style={{ display: 'none' }}>
You need HEXA to make / take Stellar HEX offers / requests. Would you like to buy
some now? {' '} <button onClick={_ => buyHEXA(opts)}>Buy HEXA</button>
{' '} Or instead, you can start watching open offers and requests (makes) 
to get a better idea of what this marketplace is about.
{' '} <button onClick={_ => watchMakes(opts)}>Watch Open Makes</button>
{' '} Please click one of these buttons. And welcome to the Stellar Help Exchange!
  </p>
</>
  );
}

const walletConnected = opts => // {{{1
<>
  <div id="typed-string">
    <p>
Great, your wallet is now connected to this demo!
    </p>
  </div>
  <div className={styles.typedwrap}>
    <span style={{ whiteSpace: 'pre' }} ref={opts.el} />
  </div>
  <p id='contextual-prompt' style={{ display: 'none' }}>
The wallet is now asking for your approval to share the public key of your Stellar
account with this demo. Go ahead and click the <b>Share</b> button. Then, since you
are OK with trusting Stellar HEX assets - ClawableHexa and HEXA - approve the two 
transactions that will create that trust.
  </p>
</>

function typedPrompt (typed, el, prompt) { // {{{1
  return (
<>
  <div id="typed-string">
    <p>{typed}</p>
  </div>
  <div className={styles.typedwrap}>
    <span style={{ whiteSpace: 'pre' }} ref={el} />
  </div>
  <p id='contextual-prompt' style={{ display: 'none' }}>{prompt}</p>
</>
  );
}

export default function Join() { // {{{1
  const [q, setQ] = useState({}) // {{{2
  useEffect(_ => setQ(p => Object.assign({}, p, {
    connected: window.freighterApi?.isConnected(),
    userAgent: window.navigator.userAgent,
  })), [q.connected, q.userAgent])
  useEffect(_ => {
    setup(q, setQ)
    /* return _ => teardown(q, setQ); */
  }, [q.connected, q.event])
  const typed = useRef(null) // {{{2
  const el = useRef(null)
  useEffect(_ => {
    if (!window.Typed) {
      return;
    }
    const options = {
      stringsElement: '#typed-string',
      typeSpeed: 50,
      onComplete: typed => {
        if (q.userAgent?.includes('Mobile')) { // {{{3
          let prompt = document.getElementById('contextual-prompt')
          setTimeout(_ => { prompt.style.display = 'block' }, 1000)

          let more = document.getElementById('more-info-on-wallets')
          setTimeout(_ => { more.style.display = 'block' }, 3000)
          return;
        }
        let prompt = document.getElementById('contextual-prompt') // {{{3
        setTimeout(_ => { 
    //console.log(q)

          if (q.connected && !q.user || q.user?.loaded.balances > 2) {
            return;
          }
          prompt.style.display = 'block' 
        }, 500) // }}}3
      },
    };
    typed.current = new window.Typed(el.current, options)
    //console.log(q)

    return _ => typed.current.destroy();
  }, [q.event])

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
      {
        q.error ? <code>{JSON.stringify(q)}</code>
        : q.userAgent?.includes('Mobile') ? mobileDevice({ el, }) // TODO 1: support mobile devices
        : q.connected ?
          q.user ? 
            q.event == 'user-loaded' ? userLoaded({ el, q, setQ, }) 
            : dispatch({ el, q, setQ, })
          : walletConnected({ el, })
        : addWallet({ el, })
      }
    </div> {/* }}}3 */}
  </>
  ); // }}}2
}
// TODO 1 hint: use https://www.npmjs.com/package/stellar-hd-wallet
