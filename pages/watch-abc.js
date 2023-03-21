import Head from 'next/head' // {{{1
import Script from 'next/script'
import styles from './index.module.css'
import abc from './watch-abc.module.css'
import { Fragment, useEffect, useRef, useState } from 'react'
import { OfferResults, Orderbook, offerCreated, } from '../foss/hex.mjs'
import { FAPI_READY, NO_WALLET, SDK_READY, flag, setupNetwork, } from '../shex'
import { /*Semaphore,*/ retrieveItem, storeItem, timestamp, } from '../foss/utils.mjs'
import { Account, Make, description, } from '../foss/stellar-account.mjs'

let timeoutMs = 40000 //, lock = new Semaphore(1) // {{{1
let realtime, realtimeTimeoutId, realtimeTimeoutMs = 1000
const resetTimeout = set => {
  clearTimeout(realtimeTimeoutId)
  realtimeTimeoutId = setTimeout(_ => realtimeTimeoutFn(set), realtimeTimeoutMs)
}
let users = {}

function effect4agent (e, set) { // {{{1
  realtime || resetTimeout(set)
  if (e.asset_code != 'HEXA' || e.type != 'account_credited' && e.type != 'account_debited') {
    return;
  }
  e.operation().then(o => {
    let t
    if (o.amount == Make.fee) { // offer/request made ? {{{2
      o.transaction().then(tX => {
        t = tX
        return (t.memo.startsWith('Offer') || t.memo.startsWith('Request')) && t.operations();
      }).then(s => {
        let r = s.records[0]
        for (let [n, v] of Object.entries(users)) {
          if (v.pk == r.source_account) {
            make(n, v, r, s, t, set)
            break
          }
        }
      }).catch(e => console.error(e))
      return;
    }
    if (e.type == 'account_credited') { // user account removed {{{2
      o.transaction().then(t => t.operations()).then(s => {
        let r = s.records.find(r => r.type == 'account_merge')
        for (let [n, v] of Object.entries(users)) {
          if (v.pk == r?.account) {
            v.removed_at = r.created_at
            break
          }
        }
      }).catch(e => console.error(e))
      return realtime && console.log(users);
    }
    if (e.type == 'account_debited') { // user account created {{{2
      o.transaction().then(t => t.operations()).then(s => {
        let r = s.records.find(r => r.type == 'manage_data' && r.name == 'greeting' && r.value)
        let name = Buffer.from(r.value, 'base64').toString()
        users[name] = { amount: e.amount, created_at: e.created_at, id: e.id, pk: o.to }
      }).catch(e => console.error(e))
      return realtime && console.log(users);
    } // }}}2
  }).catch(e => console.error(e))
}

function make (name, v, r, s, t, set) { // {{{1
  if (!v.makes) {
    v.makes = []
  }
  let d = description(s)
  v.makes.push({ created_at: r.created_at, description: d, memo: t.memo })
  if (!realtime) {
    return;
  }
  let ts = timestamp()
  let text = `${t.memo} made by ${name}: ${d}`
  set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: r.id, name, pk: v.pk, text, ts, }]) }))
}

function post (item) { // {{{1
  item.className = abc.agent
  if (item.id == '0') {
    return 'Fast-forwarding Help Exchange history...';
  }
  if (item.id == '1') {
    return `+${item.ts}ms Watching Ann, Ben, and Cyn in real time...`;
  }
  if (item.id == '2') {
    return `+${item.ts}ms Done.`;
  }
  item.className = abc[item.name.toLowerCase()]
  return `+${item.ts}ms ${item.text}`;
}

function realtimeTimeoutFn (set) { // {{{1
  realtime = true
  console.log(users)
  let ts = timestamp()
  set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: '1', ts, }]) }))
}

export default function WatchAnnBenCyn() { // {{{1
  const [wABC, setQ] = useState({}) // {{{2
  const bottomRef = useRef(null) // thanks to https://bobbyhadz.com/blog/react-scroll-to-bottom

  const streams = useRef([]), timeoutId = useRef({}), agent = useRef({}), close = useRef({})
  const timeoutFn = _ => {
    close.current()
    let ts = timestamp()
    setQ(p => Object.assign({}, p, { posts: p.posts.concat([{ id: '2', ts, }]) }))
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
    timestamp()
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
    realtimeTimeoutId = setTimeout(_ => realtimeTimeoutFn(set), realtimeTimeoutMs)
    timeoutId.current = setTimeout(timeoutFn, timeoutMs)
    set(p => Object.assign({}, p, { posts: [{ id: '0', }] }))
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
    /*
    let pk = item.pk.slice(0, 4) + '...' + item.pk.slice(-4)
    let post = item.removed ? `${item.created_at}: account ${pk} removed`
    : `${item.created_at}: account for user ${item.greeting} funded`
    */
    return (
    <Fragment key={item.id}>
      <article className={item.className} title={item.pk} >{post(item)}</article>
    </Fragment>
    );
  });
}
