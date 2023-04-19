import Head from 'next/head' // {{{1
import Script from 'next/script'
import styles from './index.module.css'
import abc from './watch-abc.module.css'
import { Fragment, useEffect, useRef, useState } from 'react'
import { Make, OfferResults, Orderbook, User, description, offerCreated, } from '../foss/hex.mjs'
import { FAPI_READY, NO_WALLET, SDK_READY, flag, setupNetwork, } from '../shex'
import { /*Semaphore,*/ retrieveItem, storeItem, timestamp, } from '../foss/utils.mjs'
//import { Account, } from '../foss/stellar-account.mjs'

let set, timeoutMs = 60000, streams = [], users = [] // {{{1
const handle4Maker = (e, name) => {
  if (name == 'Ann' && e.type == 'account_credited') {
    if (e.amount == '1000.0000000') {
      let ts = timestamp()
      let text = 'Ann has been repaid HEXA 1000.'
      set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name: 'Ann', pk: e.account, text, ts, }]) }))
    }
    return;
  }
  if (e.type != 'claimable_balance_claimant_created' || e.asset.startsWith('HEXA')) {
    return;
  }
  let ts = timestamp()
  let text = `Cyn is taking ${name}'s ${name == 'Ben' ? 'Offer' : 'Request'}...`
  set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name: 'Cyn', pk: e.account, text, ts, }]) }))
}
const handle4 = {
  Ann: e => handle4Maker(e, 'Ann'),
  Ben: e => handle4Maker(e, 'Ben'),
  Cyn: e => {
    if (e.type != 'account_credited') {
      return;
    }
    let ts = timestamp()
    let text = `Cyn took ${e.amount == '0.0000100' ? "Ben's Offer" : "Ann's Request"}.`
    set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name: 'Cyn', pk: e.account, text, ts, }]) }))
  }
}

function add2streams (user, oneffect) { // {{{1
  users.push(user)
  Make.stream(streams, user.pk, oneffect, console.error)
}

function effect4agent (e) { // {{{1
  let t // {{{2
  const use = tx => {
    t = tx
    return t.operations();
  }
  if (e.type == 'account_credited' && e.asset_code == 'HEXA') { // user account removed {{{2
    console.log('user account removed')
    return;
  }
  if (e.type == 'account_debited' && e.asset_code == 'HEXA') { // user account created {{{2
    e.operation().then(o => o.transaction()).then(t => use(t)).then(s => {
      let r = s.records.find(r => r.type == 'manage_data' && r.name == 'greeting' && r.value)
      let name = Buffer.from(r.value, 'base64').toString()
      let user = { name, pk: r.source_account, }
      add2streams(user, handle4[user.name])
      let ts = timestamp()
      let text = `${name}'s account created.`
      set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name, pk: r.source_account, text, ts, }]) }))
    }).catch(e => console.error(e))
    return;
  }
  if (e.type != 'claimable_balance_claimant_created' || e.amount != Make.fee) { // Offer/Request made {{{2
    return;
  }
  e.operation().then(o => o.transaction()).then(t => use(t)).then(s => {
    let pk = s.records[0].source_account
    let user = users.find(u => u.pk == pk)
    if (!user) {
      user = { name: t.memo.startsWith('Offer') ? 'Ben' : 'Ann', pk }
      add2streams(user, handle4[user.name])
    }
    let ts = timestamp()
    let text = `${user.name == 'Ben' ? 'Offer' : 'Request'} from ${user.name}: ${description(s)}.`
    set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name: user.name, pk, text, ts, }]) }))
  }).catch(e => console.error(e)) // }}}2
}

function effect4ich (e) { // {{{1
  if (e.type != 'claimable_balance_claimant_created') {
    return;
  }
  let ts = timestamp()
  let text = 'Ann requested repay HEXA 1000.'
  set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name: 'Ann', pk: e.account, text, ts, }]) }))
}

function post (item) { // {{{1
  item.className = abc.agent
  if (item.id == '0') {
    return 'Setting up Stellar accounts for Ann, Ben, and Cyn...';
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

export default function WatchAnnBenCyn() { // {{{1
  const [wABC, setQ] = useState({}) // {{{2
  const bottomRef = useRef(null) // thanks to https://bobbyhadz.com/blog/react-scroll-to-bottom

  const timeoutId = useRef({}), close = useRef({})
  const timeoutFn = _ => {
    close.current()
    let ts = timestamp()
    setQ(p => Object.assign({}, p, { posts: p.posts.concat([{ id: '2', ts, }]) }))
  }
  const resetTimeout = _ => {
    clearTimeout(timeoutId.current)
    timeoutId.current = setTimeout(timeoutFn, timeoutMs)
  }
  const setup = async setQ => { // {{{2
    if (wABC.posts) {
      return;
    }
    console.log('- setup')
    set = setQ
    timestamp()
    Make.stream(streams, window.StellarNetwork.hex.agent,
      e => effect4agent(e) || resetTimeout(), console.error
    )
    Make.stream(streams, window.StellarNetwork.hex.issuerClawableHexa, effect4ich, console.error)
    close.current = _ => {
      for (let stream of streams) {
        stream.close()
      }
      console.log('- teardown,', streams.length, 'streams closed')
    }
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
    return (
    <Fragment key={item.id}>
      <article className={item.className} title={item.pk} >{post(item)}</article>
    </Fragment>
    );
  });
}
