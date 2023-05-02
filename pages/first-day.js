import Head from 'next/head' // {{{1
import Script from 'next/script'
import { Fragment, useEffect, useRef, useState } from 'react'
import parse from 'html-react-parser'
import styles from './index.module.css'
import stylesDay1 from './first-day.module.css'
import { Make, OfferResults, Orderbook, User, description, offerCreated, } from '../foss/hex.mjs'
import { FAPI_READY, NO_WALLET, SDK_READY, flag, setupNetwork, } from '../shex'
import { retrieveItem, storeItem, timestamp, txRef } from '../foss/utils.mjs'

let set, timeoutMs = 60000, streams = [], users = [] // {{{1
const handle4Maker = (e, name) => { // {{{2
  if (e.type != 'claimable_balance_claimant_created' || e.asset.startsWith('HEXA')) { // {{{3
    return;
  }
  let t, user = users.find(u => u.name == name) // the user is maker {{{3
  const use = tx => {
    t = tx
    return t.operations();
  }
  e.operation().then(o => o.transaction()).then(t => use(t)).then(s => { // taking a make {{{3
    let ts = timestamp()
    let dHTML = description(s)
    let makeTxId = txRef(t)
    let make = user.makes.find(m => m.makeTxId == makeTxId)
    make.takes ??= []
    make.takes.push({ takeTxId: t.id })
    let text = `Дід Сашко is taking ${name}'s ${make.kind} ${make.count}${ dHTML ? ': ' + dHTML : ''}`
    set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name: 'take', pk: e.account, text, ts, }]) }))
  }).catch(console.error) // }}}3
}
const handle4 = { // {{{2
  'Дід Alik': e => handle4Maker(e, 'Дід Alik'),
  'Дід Сашко': e => {
    if (e.type != 'account_credited') { // {{{3
      return;
    }
    let t, user = users.find(u => u.name == 'Дід Alik') // the user is maker {{{3
    const use = tx => {
      t = tx
      return t.operations();
    }
    e.operation().then(o => o.transaction()).then(t => use(t)).then(s => { // the make is taken {{{3
      let ts = timestamp()
      let descriptionHTML = description(s)
    console.log('handle4 descriptionHTML', descriptionHTML)

      let takeTxId = txRef(t)
      let take
      const use = t => {
        take = t
        return t;
      }
      let make = user.makes.find(m => use(m.takes.find(t => t.takeTxId == takeTxId)))
      let text = `Дід Сашко took Дід Alik's ${make.kind} ${make.count}.`
      set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name: 'take', pk: e.account, text, ts, }]) }))
    }).catch(console.error) // }}}3
  }
} // }}}2

function addMake (user, makeTxId, kind) { // {{{1
  user.makes ??= []
  user.offersCount ??= 0
  user.requestsCount ??= 0
  let count = kind == 'Offer' ? ++user.offersCount : ++user.requestsCount
  user.makes.push({ kind, count, makeTxId })
  return count;
}

function add2streams (user, oneffect) { // {{{1
  users.push(user)
  Make.stream(streams, user.pk, oneffect, console.error)
}

function article(p, item) { // {{{1
  return `<article className=${item.className} title=${item.pk} >${p(item)}</article>`;
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
      let user = { name, pk: r.source_account }
      add2streams(user, handle4[user.name])
      let ts = timestamp()
      let text = `${name}'s account created.`
      set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name: 'Agent', pk: r.source_account, text, ts, }]) }))
    }).catch(console.error)
    return;
  }
  if (e.type != 'claimable_balance_claimant_created' || e.amount != Make.fee) { // {{{2
    if (e.asset?.startsWith('ClawableHexa') && e.type == 'claimable_balance_claimant_created') {
      let pk = users.find(u => u.name == 'Ben').pk
      let ts = timestamp()
      let text = `Ben is converting ClawableHexa ${e.amount} to HEXA...`
      set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name: 'Ben', pk, text, ts, }]) }))
    }
    return;
  }
  e.operation().then(o => o.transaction()).then(t => use(t)).then(s => { // Offer/Request made {{{2
    let pk = s.records[0].source_account
    let user = users.find(u => u.pk == pk)
    if (!user) {
      user = { name: t.memo.startsWith('Offer') ? 'Дід Alik' : 'Дід Сашко', pk, }
      add2streams(user, handle4[user.name])
    }
    let name = t.memo.split(' ')[0]
    let count = addMake(user, t.id, name)
    let descriptionHTML = description(s)
    let ts = timestamp()
    let text = `${user.name}'s ${name} ${count}: ${descriptionHTML}.`
    set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name, pk, text, ts, }]) }))
  }).catch(console.error) // }}}2
}

function effect4ich (e) { // {{{1
  if (e.type != 'claimable_balance_claimant_created') {
    return;
  }
  let ts = timestamp()
  let text = 'Ann requested repay ClawableHexa 1000.'
  set(p => Object.assign({}, p, { posts: p.posts.concat([{ id: e.id, name: 'Ann', pk: e.account, text, ts, }]) }))
}

function post (item) { // {{{1
  item.className = stylesDay1.agent
  if (item.id == '0') {
    return 'Started.';
  }
  if (item.id == '1') {
    return `+${item.ts}ms Watching Ann, Ben, and Cyn in real time...`;
  }
  if (item.id == '2') {
    return `+${item.ts}ms Done.`;
  }
  item.className = stylesDay1[item.name.toLowerCase()]
  return `+${item.ts}ms ${item.text}`;
}

export default function ObserveDay1Txs() { // {{{1
  const [fDay, setQ] = useState({}) // {{{2
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
    if (fDay.posts) {
      return;
    }
    console.log('- setup')
    set = setQ
    timestamp()
    Make.stream(streams, window.StellarNetwork.hex.agent, e => effect4agent(e) || resetTimeout(), console.error)
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
    console.log('fDay', fDay, 'flags', flags)
    switch (flags.current) {
      case FAPI_READY | SDK_READY:
        network = fDay.network ?? 'TESTNET'
        fDay.network || flag(flags, NO_WALLET) && setQ(_ => ({ network }))
      default:
        network && !window.StellarNetwork && setupNetwork(network) && setup(setQ)
        bottomRef.current?.scrollIntoView({behavior: 'smooth'})
    }
  }, [fDay])
  return ( // {{{2
  <>
    <Head> {/* {{{3 */}
      <title>{'Day 1'}</title>
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
Day 1: observing <span className={stylesDay1.offer}>offers</span>
, <span className={stylesDay1.request}>requests</span>
, <span className={stylesDay1.take}>takes</span>, <span className={stylesDay1.repay}>repays</span>
{' '}and  <span className={stylesDay1.assetConversion}>asset conversions</span>
{` on Stellar ${fDay.network}`}
      </h1>
      <Posts list={fDay.posts} />
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
      {parse(article(post, item))} {/* thanks to: https://www.learnbestcoding.com/post/84/string-to-html-in-react-js */}
    </Fragment>
    );
  });
}
/*
      <article className={item.className} title={item.pk} dangerouslySetInnerHTML={{__html: post(item)}}></article>
      <article className={item.className} title={item.pk} >{post(item)}</article>
*/
