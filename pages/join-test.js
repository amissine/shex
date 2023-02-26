import Head from 'next/head' // {{{1
import Link from 'next/link';
import Script from 'next/script'
import styles from './index.module.css'
import { useEffect, useRef, useState } from 'react'
import { FAPI_READY, NO_WALLET, SDK_READY, buyHEXA, flag, setupNetwork, } from '../shex'
import { retrieveItem, storeItem, } from '../foss/utils.mjs'
import { Account, } from '../foss/stellar-account.mjs'

export default function JoinTest() { // {{{1
  const flags = useRef(0) // HOOKS {{{2
  const [q, setQ] = useState({})
  useEffect(_ => {
    let network
    console.log('q', q, 'flags', flags)
    switch (flags.current) {
      case FAPI_READY | SDK_READY:
        network = q.network ?? 'TESTNET'
        q.network || flag(flags, NO_WALLET) && setQ(_ => ({ network }))
      default:
        network && !window.StellarNetwork && setupNetwork(network)
        return _ => q.close && q.close();
    }
  }, [q])
  const title = 'Join us' // {{{2
  const txStartedTxt = 'Your first transaction on Stellar TESTNET has just started! It usually takes 2 - 5 seconds to complete.'
  let txCompletedTxt = ''
  const buttonStorePressed = async event => { // {{{3
    event.preventDefault()
    let key = event.target.secretKey.value
    storeItem('mysec', key)
    const txStartedMs = Date.now()
    let keypair = window.StellarSdk.Keypair.fromSecret(key)
    const endpoint = `https://horizon-testnet.stellar.org/accounts/${keypair.publicKey()}`
    document.getElementById('buttonStore').disabled = true
    document.getElementById('txStarted').style.display = 'block'
    document.getElementById('buttonContinue').style.display = 'block'
    document.getElementById('buttonContinue').focus()
    document.getElementById('buttonContinue').scrollIntoView()
    document.getElementById('buttonContinue').disabled = true
    let a = window.StellarNetwork.hex.assets
    let user = await new Account({ keypair }).load()
    user.trust(a[0]).trust(a[1]).submit().then(txResultBody => { // {{{4
      //console.log(txResultBody)
      document.getElementById('txStarted').style.display = 'none'
      txCompletedTxt = `${txStartedTxt} This time it took ${Date.now() - txStartedMs} ms. Your account now ` +
        `<a href="${endpoint}" target="_blank">trusts our assets</a>.`
      document.getElementById('txCompleted').innerHTML = txCompletedTxt
      document.getElementById('txCompleted').style.display = 'block'
      document.getElementById('buttonContinue').innerText = 'Continue'
      document.getElementById('buttonContinue').disabled = false
      document.getElementById('buttonContinue').focus()
      document.getElementById('buttonContinue').scrollIntoView()
    }) // }}}4
  }
  const buttonContinuePressed = _ => { // {{{3
    document.getElementById('pContinue').style.display = 'block'
    document.getElementById('buttonContinue').focus()
    document.getElementById('buttonContinue').scrollIntoView()
    document.getElementById('buttonContinue').disabled = true
  } // }}}3
  const watch = _ => alert('work in progress')

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
    <p id='txStarted' style={{display:'none'}}>{txStartedTxt}..</p>
    <p id='txCompleted' style={{display:'none'}}>{txCompletedTxt}</p>
    <p id='pContinue' style={{display:'none'}}>
Now that you trust our assets you may want to buy some HEXA. <button onClick={buyHEXA}>Buy HEXA</button>{' '}
Or you can watch others making and taking help offers and help requests. <button onClick={watch}>Watch</button>{' '}
And welcome to Stellar Help Exchange!
    </p>
    <button id='buttonContinue' style={{display:'none'}} onClick={buttonContinuePressed}>Tx in progress...</button>
  </div> {/* }}}3 */}
  </>
  ) // }}}2
}
