import Head from 'next/head' // {{{1
import Link from 'next/link';
import Script from 'next/script'
import styles from './index.module.css'
import { useEffect, useRef, useState } from 'react'
import { FAPI_READY, NO_WALLET, SDK_READY, flag, setupNetwork, } from '../shex'
import { retrieveItem, storeItem, } from '../foss/utils.mjs'
import { Account, } from '../foss/stellar-account.mjs'

export default function JoinTest() { // {{{1
  const flags = useRef(0) // {{{2
  const [q, setQ] = useState({})
  useEffect(_ => {
    let network, close = _ => alert('work in progress')
    console.log('q', q, 'flags', flags)
    switch (flags.current) {
      case FAPI_READY | SDK_READY:
        network = q.network ?? 'TESTNET'
        q.network || flag(flags, NO_WALLET) && setQ(_ => ({ network, close }))
      default:
        network && !window.StellarNetwork && setupNetwork(network)
        return _ => q.close && q.close();
    }
  }, [q])
  const title = 'Join us'
  const buttonStorePressed = async event => {
    event.preventDefault()
    let key = event.target.secretKey.value
    storeItem('mysec', key)
    document.getElementById('buttonStore').disabled = true
    document.getElementById('buttonStorePressed').style.display = 'block'
    document.getElementById('buttonContinue').style.display = 'block'
    document.getElementById('buttonContinue').focus()
    document.getElementById('buttonContinue').disabled = true
    let keypair = window.StellarSdk.Keypair.fromSecret(key)
    let a = window.StellarNetwork.hex.assets
    let user = await new Account({ keypair }).load()
    user.trust(a[0]).trust(a[1]).submit().then(txBody => {
      console.log(txBody)
      document.getElementById('buttonContinue').innerText = 'Continue'
      document.getElementById('buttonContinue').disabled = false
    })
  }

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
      <h1 className={styles.description}>{`${title} on Stellar ${q.network}`}</h1>
    <p>
You need a <a href="https://stellar.org/start" target="_blank"> Stellar</a> account
to join us. You can create it by adding a wallet (for example, the Stellar
<a href="https://www.freighter.app/" target="_blank"> Freighter</a>) to your browser.
And this will be the thing to do should you decide to join us on Stellar public
network.
    </p>
    <p>
You don't need a wallet to create and fund your account on Stellar TESTNET. Use
<a href="https://laboratory.stellar.org/#account-creator?network=test" target="_blank"> Stellar Laboratory</a> to do so.
Create and fund your Stellar TESTNET account, then copy your <b>Secret Key</b> and paste it here:
    </p>
    <form onSubmit={buttonStorePressed}>
      <label>Secret Key: </label>
      <input 
    type='text' id='secretKey' required 
    pattern='^S[0-9A-Z]{55}$' 
      title='^S[0-9A-Z]{55}$'
      />
      <button id='buttonStore' type="submit"> Store</button>
    </form>
    <p>
When you press the <i>Store</i> button, we store your Secret Key <b>on this device ONLY</b>. And we update your
Stellar account to make it trust our assets.
    </p>
    <p id='buttonStorePressed' style={{ display: 'none' }}>
Your first transaction on Stellar TESTNET has just started. It usually takes 2 - 5 seconds to complete.
Please now wait until the button below reads <i>Continue</i>, then press it.
    </p>
    <button id='buttonContinue' style={{display:'none'}} onClick={_ => q.close()}>Tx in progress...</button>
  </div> {/* }}}3 */}
  </>
  ) // }}}2
}
