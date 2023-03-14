import Head from 'next/head' // {{{1
import Script from 'next/script'
import styles from './index.module.css'
import abc from './watch-abc.module.css'
import { Fragment, useEffect, useRef, useState } from 'react'
import { OfferResults, Orderbook, offerCreated, } from '../foss/hex.mjs'
import { FAPI_READY, NO_WALLET, SDK_READY, flag, setupNetwork, } from '../shex'
import { Semaphore, retrieveItem, storeItem, timestamp, } from '../foss/utils.mjs'
import { Account, } from '../foss/stellar-account.mjs'

let timeoutMs = 4000, count = 0 //, lock = new Semaphore(1) // {{{1

function delta (label) { // {{{1
  let ts = timestamp(label)
  return  ts > 1678226272982 ? '- ' + ts : '+ ' + ts;
}

function effect4agent (e, set) { // {{{1
  if (e.type != 'account_debited' || e.asset_code != 'HEXA') {
    return;
  }
  e.operation().then(o => e4u(set, e, o))
}

function e4u (set, e, o) { // {{{1
  let itemRemoved = false
  let close = window.StellarHorizonServer.effects().forAccount(o.to).stream({
    onerror:   r => console.error(r),
    onmessage: m => {
      let item = { account_funded: o.to, amount_funded: e.amount, count: ++count }
      userInfo(m, item) && set(p => Object.assign({}, p, { posts: p.posts.concat([item]) }))
      item.removed && close()
      itemRemoved = item.removed
    }
  })
  setTimeout(_ => itemRemoved || close(), 900)
}

function userInfo (m, item) { // {{{1
  if (!item.started && delta(m.account) > 1678372929432) {
    item.started = true
    return;
  }
  item.created_at = m.created_at
  switch (m.type) {
    case 'data_created':
      item.id = m.id
      item[m.name] = Buffer.from(m.value, 'base64').toString()
      return m.name == 'greeting';
    //case 'trustline_removed':
    case 'account_removed':
      item.id = m.id
      item.removed = true
      return true;
  }
}

export default function WatchAnnBenCyn() { // {{{1
  const [wABC, setQ] = useState({}) // {{{2
  const bottomRef = useRef(null) // thanks to https://bobbyhadz.com/blog/react-scroll-to-bottom

  const streams = useRef([]), timeoutId = useRef({}), agent = useRef({}), close = useRef({})
  const timeoutFn = _ => {
    clearTimeout(timeoutId.current)
    close.current()
  }
  const resetTimeout = _ => {
    clearTimeout(timeoutId.current)
    timeoutId.current = setTimeout(timeoutFn, timeoutMs)
  }
  const setup = async set => { // {{{2
    if (wABC.posts) {
      return;
    }
    console.log('- setup')
    let server = window.StellarHorizonServer
    let agentPK = window.StellarNetwork.hex.agent
    let keypair = window.StellarSdk.Keypair.fromPublicKey(agentPK)
    streams.current.push({ close: server.effects().forAccount(agentPK).stream({
      onerror:   e => console.error(e),
      onmessage: e => effect4agent(e, set) || resetTimeout()
    }) })
    close.current = _ => {
      for (let stream of streams.current) {
        stream.close()
      }
      console.log('- teardown,', streams.current.length, 'streams closed')
    }
    timeoutId.current = setTimeout(timeoutFn, timeoutMs)
    set(p => Object.assign({}, p, { posts: [] }))
  }

  const flags = useRef({}) // {{{2

  useEffect(_ => { // {{{2
    let network
    console.log('wABC', wABC, 'flags', flags)
    switch (flags.current) {
      case FAPI_READY | SDK_READY:
        network = wABC.network ?? 'TESTNET'
        wABC.network || flag(flags, NO_WALLET) && setQ(_ => ({ network }))
      default:
        network && !window.StellarNetwork && setupNetwork(network) && setup(setQ)
        bottomRef.current?.scrollIntoView({behavior: 'smooth'})
    }
  }, [wABC])
  return ( // {{{2
  <>
    <Head> {/* {{{3 */}
      <title>{'Watch ABC'}</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    {/* Script stellar-freighter-api/1.3.1 {{{3 */}
    <Script
      onError={e => console.error(e)}
      onReady={_ => flag(flags, FAPI_READY) && window.freighterApi?.isConnected() &&
        window.freighterApi.getNetwork().then(network => setQ(_ => ({ network }))) 
        || setQ(_ => ({}))
      }
      src="https://cdnjs.cloudflare.com/ajax/libs/stellar-freighter-api/1.3.1/index.min.js"
      strategy="afterInteractive"
    />

    {/* Script stellar-sdk/10.4.0 {{{3 */}
    <Script
      onError={e => console.error(e)}
      onReady={_ => flag(flags, SDK_READY) && window.StellarSdk && 
        setQ(p => Object.assign({}, p))
      }
      src="https://cdnjs.cloudflare.com/ajax/libs/stellar-sdk/10.4.0/stellar-sdk.js"
      strategy="lazyOnload"
    />

    <div className={styles.container}> {/* {{{3 */}
      <h1 className={styles.description}>
Watch <span className={abc.ann}>Ann</span>, <span className={abc.ben}>Ben</span>,
and  <span className={abc.cyn}>Cyn</span>
{` on Stellar ${wABC.network}`}
      </h1>
      <Posts list={wABC.posts} />
      <div ref={bottomRef} />
    </div> {/* }}}3 */}
  </>
  ); // }}}2
}

function Posts ({ list }) { // {{{1
  if (!list?.length) {
    return;
  }
  return list.map(item => {
    let pk = item.account_funded.slice(0, 4) + '...' + item.account_funded.slice(-4)
    let post = item.removed ? `${item.created_at}: account ${pk} removed`
    : `${item.created_at}: account for user ${item.greeting} funded`
    post += ', count ' + item.count
    return (
    <Fragment key={item.id}>
      <article className={abc.agent} title={item.account_funded} >{post}</article>
    </Fragment>
    );
  });
}
