import { stellarNetworks, } from '../foss/stellar-networks.mjs' // {{{1
import { Account, } from '../foss/stellar-account.mjs'
import { hexAssets, } from '../foss/hex.mjs'
import freighterApi from "@stellar/freighter-api";

async function setup (state, setState) { // {{{1
  if (!state.connected || !window.StellarSdk) { // {{{2
    //console.log('state.connected', state.connected)
    window.freighterApi = freighterApi
    return;
  } // }}}2
  const fapi = window.freighterApi // {{{2
  let keypair
  return await fapi.getPublicKey().then(pk => { 
    keypair = window.StellarSdk.Keypair.fromPublicKey(pk) 
    return fapi.getNetwork();
  }).then(async name => {
    let network = stellarNetworks().filter(v => v.name == name)[0]
    window.StellarNetwork = network
    hexAssets(network.hex)
    let user = await new Account({ keypair }).load()
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

