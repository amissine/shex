import Head from 'next/head' // {{{1
import Link from 'next/link';
import Script from 'next/script'
import styles from './index.module.css'
import { useEffect, useRef, useState } from 'react'
import { OfferResults, Orderbook, offerCreated, } from '../foss/hex.mjs'
import { FAPI_READY, NO_WALLET, SDK_READY, flag, setupNetwork, } from '../shex'
import { Semaphore, retrieveItem, storeItem, timestamp, } from '../foss/utils.mjs'
import { Account, } from '../foss/stellar-account.mjs'

let timeoutMs = 60000, lock = new Semaphore(1) // {{{1

function readOrderbook (orderbook) { // {{{1
  let ob = new Orderbook(orderbook)
  let lines = ob.line() + '\n' + document.getElementById('orderbook').value
  document.getElementById('orderbook').value = lines
}

export default function TradeHEXAforXLM() { // {{{1
  const title = 'Trade HEXA@XLM', rows = 4, cols = 100, mysec = useRef({}) // {{{2
  const orders = useRef([])
  const timeoutFn = _ => lock.acquire().then(_ => { // {{{2
    let ov = document.getElementById('orderbook').value
    document.getElementById('orderbook').value = 'timeout' + '\n' + ov
    lock.release()
    if (orders.current.length == 0) {
      document.getElementById('buttonStop').click()
      return;
    }
    let HEXA = window.StellarNetwork.hex.assets[1]
    let native = new window.StellarSdk.Asset('XLM', null)
    let count = 0
    for (let o of orders.current) {
      let buy = o.selling.asset_type == 'native'
      let opts = buy ? { 
        selling: native, buying: HEXA, buyAmount: '0', price: { d: o.price_r.n, n: o.price_r.d }, offerId: o.id 
      }
      : { selling: HEXA, buying: native, amount: '0', price: o.price_r, offerId: o.id }
      lock.acquire().then(_ => {
        let ov = document.getElementById('orders').value
        let order = 'deleting id ' + o.id + '...'
        document.getElementById('orders').value = order + '\n' + ov
        user.current.manageOffer(opts).submit().then(txResultBody => {
          order += new OfferResults(txResultBody).toString()
        }).catch(e => console.error(e))
        .finally(_ => {
          document.getElementById('orders').value = order + '\n' + ov
          document.getElementById('buttonPlace').disabled = false
          lock.release()
          ++count == orders.current.length && document.getElementById('buttonStop').click()
        })
      })
    }
  })
  const timeoutId = useRef({}), user = useRef({})
  const [sXLM_bHEXA, setOb] = useState({}) // {{{2
  const stop = _ => { // {{{2
    sXLM_bHEXA.close()
    let ov = document.getElementById('orderbook').value
    document.getElementById('orderbook').value = 'stop' + '\n' + ov
    document.getElementById('buttonPlace').disabled = true
    document.getElementById('buttonStop').disabled = true
    clearTimeout(timeoutId.current)
  }
  const buttonPlacePressed = event => { // {{{2
    event.preventDefault()
    let order = event.target.order.value
    clearTimeout(timeoutId.current)
    timeoutId.current = setTimeout(timeoutFn, timeoutMs)
    let ov = document.getElementById('orders').value
    document.getElementById('orders').value = order + '\n' + ov
    let buy = order.startsWith('b')
    let [amount, price] = order.slice(1).split('@')
    let server = window.StellarHorizonServer
    let HEXA = window.StellarNetwork.hex.assets[1]
    let native = new window.StellarSdk.Asset('XLM', null)
    let opts = buy ? { selling: native, buying: HEXA, buyAmount: amount, price }
    : { selling: HEXA, buying: native, amount, price }
    document.getElementById('buttonPlace').disabled = true
    lock.acquire().then(_ => user.current.manageOffer(opts).submit())
    .then(txResultBody => {
      order += new OfferResults(txResultBody).toString()
    }).catch(e => {
      order += ' ERROR: check console for details'
      console.error('***', e)
    })
    .finally(_ => {
      document.getElementById('orders').value = order + '\n' + ov
      document.getElementById('buttonPlace').disabled = false
      lock.release()
    })
  }
  const setupOb = async set => { // {{{2
    console.log('- setupOb')
    let server = window.StellarHorizonServer
    let HEXA = window.StellarNetwork.hex.assets[1]
    let native = new window.StellarSdk.Asset('XLM', null)
    let closeOrderbook = server.orderbook(HEXA, native).stream({
      onerror:   e => console.error(e),
      onmessage: b => readOrderbook(b)
    })
    mysec.current = retrieveItem('mysec') // FIXME, use wallet
    let keypair = window.StellarSdk.Keypair.fromSecret(mysec.current)
    user.current = await new Account({ keypair }).load()
    let closeOffers = server.offers().forAccount(user.current.loaded.id).stream({
      onerror:   e => console.error(e),
      onmessage: o => orders.current.push(o)
    })
    let close = _ => {
      closeOffers()
      closeOrderbook()
      console.log('- setupOb, streams closed')
    }
    set(p => Object.assign({}, p, { close }))
    timeoutId.current = setTimeout(timeoutFn, timeoutMs)
  }

  const flags = useRef({}) // {{{2
  useEffect(_ => { // {{{2
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
      <textarea readOnly={true} id='orderbook' rows={rows} cols={cols}/>
      <button id='buttonStop' onClick={stop}>Stop</button>
      <form onSubmit={buttonPlacePressed}>
        <label>Place order: </label>
        <input 
    type='text' id='order' required 
    pattern='^[bs]\d{1,3}(\.\d{1,6})?@\d{1,3}(\.\d{1,6})?$' 
      title='^[bs]\d{1,3}(\.\d{1,6})?@\d{1,3}(\.\d{1,6})?$'
        />
        <button id='buttonPlace' type="submit"> Place</button>
      </form>
      <label>Your order(s)</label>
      <textarea readOnly={true} id='orders' rows={rows} cols={cols}/>
    </div> {/* }}}3 */}
  </>
  ) // }}}2
}
