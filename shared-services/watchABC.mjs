#!/usr/bin/env node
import { setMaxListeners, } from 'node:events' // {{{1
import sdk from 'stellar-sdk'
import fetch from 'node-fetch' // to call CFW
import { stellarNetworks, } from '../foss/stellar-networks.mjs'
import { Make, Offer, Request, User, description, dog2hexa, hexAssets, hexa2dog, } from '../foss/hex.mjs'
import { Account, } from '../foss/stellar-account.mjs'
import { Semaphore, timestamp, txRef, } from '../foss/utils.mjs'

const ts = (...a) => { // {{{1
  let tv = timestamp()
  let prefix = tv > 1674128077678 ?
    `- ${new Date()}, ${process.argv[1]} started:`
  : `+ ${tv} ms:`
  console.log(prefix, ...a)
}
let network = process.argv[2]
ts('network', network)
setMaxListeners(100)

global.fetch = fetch
global.window = {
  StellarNetwork: stellarNetworks().filter(v => v.id == network)[0],
  StellarSdk: sdk
}
global.window.StellarHorizonServer = 
  new window.StellarSdk.Server(window.StellarNetwork.url)
hexAssets(window.StellarNetwork.hex) // producing hex.assets: [ClawableHexa, HEXA]

let done, bad, line = 'stdin EOF' // {{{1
let promise = new Promise((resolve, reject) => { done = resolve; bad = reject })

process.stdin.on('data', data => read(data.toString()))
process.stdin.on('end', _ => done(line))

let streams = [], lock = new Semaphore(1) // {{{2
Make.stream(streams, window.StellarNetwork.hex.agent, effect4agent, console.error)
Make.stream(streams, window.StellarNetwork.hex.issuerClawableHexa, effect4ich, console.error)

let ids = [{ name: 'Ann'}, { name: 'Ben'}, { name: 'Cyn'}], users = [] // {{{2

let agent = await new Account({
  keypair: window.StellarSdk.Keypair.fromSecret(
    process.env[`AGENT_SECRET_${network}`]
  )
}).load()

let issuerCH = await new Account({
  keypair: window.StellarSdk.Keypair.fromSecret(
    process.env[`ClawableHexa_ISSUER_SECRET_${network}`]
  )
}).load()

let creator = await new Account({
  keypair: window.StellarSdk.Keypair.fromSecret(process.env.PRIVATE_CREATOR_SK)
}).load()
let startingBalance = '200' // XLM
for (let id of ids) {
  id.keypair = window.StellarSdk.Keypair.random()
  creator.create(id.keypair.publicKey(), startingBalance)
}
await creator.submit() // create Stellar accounts

for (let id of ids) {
  lock.acquire().then(_ => addHEXuser(id.name, id.keypair)).
  then(_ => lock.release()).
  then(_ => setupCheckCompletion()).catch(e => console.error(e))
}

// }}}2

await promise.then(l => quit(l)).catch(e => { throw e; })
console.log('- bin/watchABC.mjs', 'exiting...')
process.exit(0)

async function addHEXuser (greeting, keypair) { // {{{1
  let opts = { greeting, keypair,
    startingBalanceCH: '5000', startingBalanceH: '5000',
  }
  let agentKeypair = window.StellarSdk.Keypair.fromSecret(
    process.env[`AGENT_SECRET_${window.StellarNetwork.id}`]
  )
  let keypairs = [keypair, agentKeypair]

  return await new User(opts).load().then(user => {
    users.push(user)
    ts('addHEXuser:', greeting, user.loaded.id)
    return user.add().submit({ keypairs });
  });
}

function convertClawableHexaToHEXA (name, memo, amount) { // {{{1
  let user
  loadUser(name).then(u => {
    user = u
    return lock.acquire();
  }).then(_ => user.convertClawableHexaToHEXA({ memo, amount })).then(r => {
    ts(`${name} is converting ClawableHexa ${amount} balanceId`, r.balanceId)
    lock.release()
  }).catch(console.error)
}

function convertToHEXA (v, r, s, t, e) { // {{{1
  let balanceId = e.balance_id
  let paymentId = txRef(t)
  let amount = e.amount // TODO authorize amount(paymentId)
  let asset = window.StellarNetwork.hex.assets[1] // HEXA
  let destination = t.source_account // Ben

  let ccb = window.StellarSdk.Operation.claimClaimableBalance({ balanceId })
  ts('Agent acquiring lock to convert amount', amount, 'for paymentId', paymentId)
  lock.acquire().then(_ => agent.cb(ccb, window.StellarSdk.Memo.hash(paymentId)).
    pay(asset, amount, null, destination).submit()
  ).then(txR => {
    ts('Agent releasing lock converted tx', txR.id)
    lock.release()
  }).catch(console.error)
}

function effect4agent (e) { // {{{1
  if (e.type != 'claimable_balance_claimant_created') {
    return;
  }
  e.operation().then(o => o.transaction()).then(t => {
    t.operations().then(s => {
      let r = s.records[0]
      let v = ids.find(id => id.keypair.publicKey() == r.source_account)
      e.asset.startsWith('HEXA') ? made(v, r, s, t) : convertToHEXA(v, r, s, t, e)
    }).catch(e => console.error(e))
  }).catch(e => console.error(e))
}

function effect4ich (e) { // {{{1
  if (e.type != 'claimable_balance_claimant_created') {
    return;
  }
  const use = t => t.operations().then(s => {
    //console.log(s)
    let r = s.records.find(op => !!op.amount)
    let asset = window.StellarNetwork.hex.assets[0] // ClawableHexa
    let amount = dog2hexa(hexa2dog(r.amount) - hexa2dog(Make.fee))
    let from = r.to ?? r.claimants[0].destination
    ts('issuerCH acquiring lock')
    return lock.acquire().then(_ => issuerCH.clawback({ asset, amount, from }).
      pay(asset, amount, null, t.source_account).submit()
    ).then(txR => {
      ts('issuerCH releasing lock repaid tx', txR.id)
      lock.release()
    });
  })
  e.operation().then(o => o.transaction()).then(t => {
    let takeId = txRef(t)
    ts('effect4ich takeId', takeId)
    return takeId;
  }).then(takeId => window.StellarHorizonServer.transactions().transaction(takeId).call())
    .then(t => use(t))
    .catch(console.error)
}

function getRepaid (name, tx) { // {{{1
  let user
  loadUser(name).then(u => {
    user = u
    return lock.acquire();
  }).then(_ => user.repay(tx)).then(balanceId => {
    ts(`${name} requested repay balanceId`, balanceId)
    ts(`${name} requested repay for tx`, tx)
    reclaim(user.loaded.id, balanceId, 30000)
    lock.release()
  }).catch(console.error)
}

function loadUser (name) { // {{{1
  let id = ids.find(id => id.name == name)
  id ??= ids.find(id => id.keypair.publicKey() == name)
  //ts('loadUser', name, id)
  return new User({ keypair: id.keypair }).load();
}

function made (v, r, s, t) { // {{{1
  if (!v.makes) { // {{{2
    v.makes = []
  }
  let d = description(s)
  let make = { 
    created_at: r.created_at, description: d, makerPK: r.source_account, memo: t.memo, 
    txId: t.id,
  }
  make = t.memo.startsWith('Offer') ? new Offer(make) : new Request(make)
  v.makes.push(make)
  const use = (t, m) => { // {{{2
    if (t.source_account == issuerCH.loaded.id) {
      ts('Cyn has been repaid')
      return;
    }
    if (t.memo_type != 'hash') {
      ts('made use t', t.id, 'memo', t.memo_type, t.memo)
      return;
    }
    let takeId = new window.StellarSdk.Memo(
      t.memo_type, 
      Buffer.from(t.memo, 'base64')
    ).value.toString('hex')
    ts('made take taken transaction', takeId)
    if (m.amount != Make.fee) {
      ts('made take taken request amount', m.amount)
      return;
    }
    //getRepaid('Cyn', takeId)
  }
  const taken = m => { // {{{2
    if (m.type != 'account_credited' || m.asset_code == 'HEXA') {
      return;
    }
    //ts('account_credited', m)
    m.operation().then(o => o.transaction()).then(t => use(t, m)).catch(e => console.error(e))
  }
  ts('Cyn acquiring lock for make tx', make.txId) // {{{2
  lock.acquire().then(_ => make.take(
    { taker: ids.find(id => id.name == 'Cyn') }, streams, taken
  )).then(r => {
    ts('Cyn releasing lock for make tx', make.txId)
    ts('Cyn take tx', r.txId, 'balanceId', r.balanceId)
    lock.release()
  }).catch(console.error) // }}}2
}

function makeOfferBen () { // {{{1
  let offer = new Offer({ // {{{2
    description: 'Freshly caught red snapper 4 lb. HEXA 800',
    validity: '36000', // seconds; '0' - unlimited (default)
  })
  let user, ccb, takerPK, takerTxId, memo, amount // {{{2
  const use = (t, m) => {
    takerTxId = t.id
    takerPK = t.source_account
    let makeId = new window.StellarSdk.Memo(
      t.memo_type, // must be 'hash'
      Buffer.from(t.memo, 'base64')
    ).value.toString('hex')
    amount = dog2hexa(hexa2dog(m.amount) - hexa2dog(Make.fee))
    ts('Ben has a take on his make tx', makeId)
    ts("Ben claims Cyn's take on Ben's offer", amount, m.balance_id)
    ts("Ben claims Cyn's take takerTxId", takerTxId)
    return loadUser('Ben');
  }
  let id = ids.find(id => id.name == 'Ben')
  const onmessage = m => { // {{{2
    if (m.type != 'claimable_balance_claimant_created' || // {{{3
      m.asset.startsWith('HEXA') || id.convertingToHEXA) {
      return;
    }
    m.operation().then(o => o.transaction()). // {{{3
      then(t => use(t, m)).then(userBen => {
        user = userBen
        ccb = window.StellarSdk.Operation.claimClaimableBalance({
          balanceId: m.balance_id,
        })
      }).then(_ => {
        ts('Ben acquiring lock')
        return lock.acquire();
      }).then(_ => user.cb(ccb, memo = window.StellarSdk.Memo.hash(takerTxId)).
        pay(user.network.hex.assets[0], Make.fee, null, takerPK).submit()
      ).then(txR => {
        id.convertingToHEXA = true
        setTimeout(_ => convertClawableHexaToHEXA('Ben', memo, amount), 7000)
        ts('Ben releasing lock claim tx', txR.id)
        lock.release()
      }).catch(console.error) // }}}3
  }
  loadUser('Ben').then(userBen => { // {{{2
    user = userBen
  }).then(_ => {
    ts('Ben acquiring lock')
    return lock.acquire();
  }).then(_ => user.make(offer)).then(r => {
    ts('Ben releasing lock offer tx', r.txId)
    lock.release()
    reclaim(user.loaded.id, r.balanceId)
    Make.stream(streams, user.loaded.id, onmessage, console.error)
  }).catch(console.error) // }}}2
}

function makeRequestAnn () { // {{{1
  let request = new Request({ // {{{2
    description: 'Fresh red snapper for 4 persons GGS. HEXA 1000',
    validity: '28800', // seconds; '0' - unlimited (default)
  })
  let user, ccb, takerPK, takerTxId // {{{2
  const use = t => {
    takerTxId = t.id
    takerPK = t.source_account
    return loadUser('Ann');
  }
  const onmessage = m => {
    if (m.type != 'claimable_balance_claimant_created' || m.asset.startsWith('HEXA')) {
      return;
    }
    ts("Ann claims Cyn's take on Ann's request", m.amount, m.balance_id)
    m.operation().then(o => o.transaction()).
      then(t => use(t)).then(userAnn => {
        user = userAnn
        ccb = window.StellarSdk.Operation.claimClaimableBalance({
          balanceId: m.balance_id,
        })
      }).then(_ => {
        ts('Ann acquiring lock')
        return lock.acquire();
      }).
      then(_ => user.cb(ccb, window.StellarSdk.Memo.hash(takerTxId)).
        pay(user.network.hex.assets[0], dog2hexa(hexa2dog(request.amount) + hexa2dog(Make.fee)), 
          null, takerPK
        ).submit()
      ).then(txR => {
        setTimeout(_ => getRepaid('Ann', txR.id), 7000)
        ts('Ann releasing lock claim tx', txR.id)
        lock.release()
      }).catch(console.error)
  }
  loadUser('Ann').then(userAnn => { // {{{2
    user = userAnn
  }).then(_ => {
    ts('Ann acquiring lock')
    return lock.acquire();
  }).then(_ => user.make(request)).then(r => {
    ts('Ann releasing lock request tx', r.txId)
    lock.release()
    reclaim(user.loaded.id, r.balanceId)
    Make.stream(streams, user.loaded.id, onmessage, console.error)
  }).catch(console.error) // }}}2
}

function read (line) { // line ends with \n {{{1
  ts('read line', line)
}

function reclaim(pk, balanceId, timeout = 45000) { // {{{1
  let user, ccb
  setTimeout(_ => lock.acquire().then(_ => loadUser(pk)).then(userABC => {
      user = userABC
      ccb = window.StellarSdk.Operation.claimClaimableBalance({ balanceId, })
    }).then(_ => user.cb(ccb).submit()).
      then(txR => ts('pk', pk, 'reclaim claimed txId', txR.id)).
      then(_ => lock.release()).catch(console.error),
    timeout
  )
}

async function removeAccount (id) { // {{{1
  let userIndex = users.findIndex(u => u.loaded.id == id.keypair.publicKey())
  await new User({ keypair: id.keypair }).load().
    then(user => user.remove(creator.loaded.id)).
    then(user => user.submit()).then(txR => ts('removeAccount txR.id', txR.id))
  users.splice(userIndex, 1)
}

function quit (l) { // {{{1
  for (let stream of streams) {
    stream.close()
    ts('closed stream', stream)
  }
  ts('quit:', l, 'closed', streams.length, 'streams.')
}

function setupCheckCompletion () { // {{{1
  if (users.length < ids.length) {
    return;
  }
  for (let id of ids) {
    ts('setupCheckCompletion', id.name, id.keypair.secret())
  }
  makeRequestAnn()
  makeOfferBen()
  setTimeout(teardown, 90000)
}

function teardown () { // {{{1
  for (let id of ids) {
    lock.acquire().then(_ => removeAccount(id)).
    then(_ => {
      ts(`teardown removed ${id.name}'s account`)
      users.length == 0 && done('teardown completed,')
      lock.release()
    }).catch(e => console.error(e))
  }
}

