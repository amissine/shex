import Head from 'next/head' // {{{1
import Link from 'next/link';
import Script from 'next/script'
import styles from './index.module.css'
import { useEffect, useRef, useState } from 'react'
import { Orderbook, } from '../foss/hex.mjs'
import { FAPI_READY, NO_WALLET, SDK_READY, flag, setupNetwork, } from '../shex'

function readOrderbook (orderbook) { // {{{1
  let ob = new Orderbook(orderbook)
  let lines = ob.line() + '\n' + document.getElementById('orderbook').value
  document.getElementById('orderbook').value = lines
}

export default function TradeHEXAforXLM() { // {{{1
  const title = 'Trade HEXA@XLM', rows = 4, cols = 100 // {{{2
  const onSubmit = event => {
    event.preventDefault()
    alert(event.target.order.value)
  }
  const setupOb = set => {
    console.log('setupOb')
    let server = window.StellarHorizonServer
    let HEXA = window.StellarNetwork.hex.assets[1]
    let native = new window.StellarSdk.Asset('XLM', null)
    let close = server.orderbook(HEXA, native).stream({
      onerror:   e => console.error(e),
      onmessage: b => readOrderbook(b) // the entry point
    })
    set(p => Object.assign({}, p, { close }))
  }

  // Hooks {{{2
  const flags = useRef(0)
  const [sXLM_bHEXA, setOb] = useState({})
  useEffect(_ => {
    let network
    console.log('sXLM_bHEXA', sXLM_bHEXA, 'flags', flags)
    switch (flags.current) {
      case FAPI_READY | SDK_READY:
        network = sXLM_bHEXA.network ?? 'TESTNET'
        sXLM_bHEXA.network || flag(flags, NO_WALLET) && setOb(_ => ({ network }))
      default:
        network && !window.StellarNetwork && setupNetwork(network) && setupOb(setOb)
        return _ => sXLM_bHEXA.close && sXLM_bHEXA.close();
    }
  }, [sXLM_bHEXA])

  return ( // {{{2
  <>
    <Head> {/* {{{3 */}
      <title>{title}</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    {/* Script stellar-freighter-api/1.3.1 {{{3 */}
    <Script
      onError={e => console.error(e)}
      onReady={_ => flag(flags, FAPI_READY) && window.freighterApi?.isConnected() &&
        window.freighterApi.getNetwork().then(network => setOb(_ => ({ network }))) 
        || setOb(_ => ({}))
      }
      src="https://cdnjs.cloudflare.com/ajax/libs/stellar-freighter-api/1.3.1/index.min.js"
      strategy="afterInteractive"
    />

    {/* Script stellar-sdk/10.4.0 {{{3 */}
    <Script
      onError={e => console.error(e)}
      onReady={_ => flag(flags, SDK_READY) && window.StellarSdk && 
        setOb(p => Object.assign({}, p))
      }
      src="https://cdnjs.cloudflare.com/ajax/libs/stellar-sdk/10.4.0/stellar-sdk.js"
      strategy="lazyOnload"
    />

    <div className={styles.container}> {/* {{{3 */}
      <h1 className={styles.description}>{`${title} on Stellar ${sXLM_bHEXA.network}`}</h1>
      <label>Orderbook</label>
      <textarea id='orderbook' rows={rows} cols={cols}/>
      <button onClick={_ => sXLM_bHEXA.close()}>Stop</button>
      <form onSubmit={onSubmit}>
        <label>Place order: </label>
        <input 
    type='text' id='order' required 
    pattern='^[bs]\d{1,3}(\.\d{1,6})?@\d{1,3}(\.\d{1,6})?$' 
      title='^[bs]\d{1,3}(\.\d{1,6})?@\d{1,3}(\.\d{1,6})?$'
        />
        <button type="submit"> Place</button>
      </form>
      <label>Your order(s)</label>
      <textarea id='orders' rows={rows} cols={cols}/>
    </div> {/* }}}3 */}
  </>
  ) // }}}2
}
