import { stellarNetworks, } from '../foss/stellar-networks.mjs' // {{{1
import { Account, } from '../foss/stellar-account.mjs'
import { hexAssets, } from '../foss/hex.mjs'

async function setup (state, setState) { // {{{1
  if (!state.connected || !window.StellarSdk) { // {{{2
    return;
  } // }}}2
  const fapi = window.freighterApi // {{{2
  let keypair, account
  return await fapi.getPublicKey().then(pk => {
    account = pk
    keypair = window.StellarSdk.Keypair.fromPublicKey(pk) 
    return fapi.getNetwork();
  }).then(async name => {
    let network = stellarNetworks().filter(v => v.name == name)[0]
    window.StellarNetwork = network
    hexAssets(network.hex)
    //let user = await (new Account({ keypair }).load())
    let server = new window.StellarSdk.Server(network.url)
    let loaded = await server.loadAccount(account)
    let user = new Account({ loaded })
    if (user.trusts(network.hex)) {
      return;
    }
    for (let asset of network.hex.assets) {
      await user.trust(asset).sign(window.freighterApi)
        .then(xdr => user.submit({ xdr }))
        .catch(e => console.error(e))
    }
    console.log('user', user)
    setState(p => Object.assign({}, p, { user, }))
  }); // }}}2
}

function teardown (state, setState) { // {{{1
  console.log('teardown start', state)
}

export { setup, teardown, } // {{{1

