import { stellarNetworks, } from '../foss/stellar-networks.mjs' // {{{1
import { Account, } from '../foss/stellar-account.mjs'
import { hexAssets, } from '../foss/hex.mjs'
import { pGET, } from '../foss/utils.mjs'

function buyHEXA (opts) { // {{{1
  console.log('buyHEXA opts', opts)
  opts.setQ(p => Object.assign({}, p, { event: 'buyHEXA-started', }))

  let servicePath = 'bin/buyHEXA.mjs'
  let servicePK = 'GDRPCVMDO3DXYGYR4KTN57PI3AX2PKKDY2I7ZVMSTFLEDBMCBFYSD5QE'
  let serviceConsumerSK = window.StellarSdk.Keypair.random().secret()

  let url = pGET(
    `/request-service/${servicePK}/${servicePath}`, '', serviceConsumerSK, true
  )
  window.open(url, '_blank')
  /*
    .then(result => {
      console.log(result)
      opts.setQ(p => Object.assign({}, p, { event: 'buyHEXA-stopped', }))
    })
    .catch(e => console.error(e))
  */
}

async function setup (state, setState) { // {{{1
  if (state.user || !state.connected || !window.StellarSdk) { // {{{2
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
    if (!user.trusts(network.hex)) {
      for (let asset of network.hex.assets) {
        await user.trust(asset).sign(window.freighterApi)
          .then(xdr => user.submit({ xdr })).catch(e => console.error(e))
      }
    }
    console.log('setup user', user)

    setState(p => Object.assign({}, p, { event: 'user-loaded', user, }))
  }); // }}}2
}

function teardown (state, setState) { // {{{1
  console.log('teardown start', state)
}

function watchMakes (opts) { // {{{1
  console.log('watchMakes opts', opts)
  opts.setQ(p => Object.assign({}, p, { event: 'watchMakes-started', }))
  pGET('/request-service/bin/watchMakes.mjs')
    .then(result => {
      console.log(result)
      opts.setQ(p => Object.assign({}, p, { event: 'watchMakes-stopped', }))
    })
    .catch(e => console.error(e))
}

export { buyHEXA, setup, teardown, watchMakes, } // {{{1

