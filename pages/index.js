import Head from 'next/head'
import Link from 'next/link';
import styles from './index.module.css'

export default function Home() {
  return (
  <>
    <Head>
      <title>Stellar HEX</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className={styles.container}>
      <main>
        <h1 className={styles.title}>
          <a href='https://stellar.org'>Stellar</a> Help Exchange
        </h1>
        <p className={styles.description}>
          An equitable distributed marketplace
        </p>
        <div className={styles.grid}>
          <a 
            href="https://github.com/amissine/shex/blob/main/README.md" 
            className={styles.card}
          >
            <h3>What Is It? &rarr;</h3>
            <p>
    Stellar Help Exchange (HEX) runs on Stellar Network.
    It is a place where Stellar users exchange all kinds of help for HEXA -
    the Help Exchange Asset. If you do not get the help you paid for, 
    you get your HEXA back. 
            </p>
          </a>
          <a 
            href="https://github.com/amissine/shex/blob/main/README.md#how-it-works" 
            className={styles.card}
          >
            <h3>How Does It Work? &rarr;</h3>
            <p>
    Users make and take help offers and help requests. You pay for help first. No help -
    you claim your HEXA back. If the help provider has no proof of delivery, their reputation
    suffers and you get your payment back. Otherwise, your reputation suffers.
            </p>
          </a>
          <a
            href="https://github.com/amissine/shex/blob/main/README.md#work-in-progress"
            className={styles.card}
          >
            <h3>Why Should I Care? &rarr;</h3>
            <p>
    Join Stellar HEX, check open offers and requests. Make an offer or a request.
    Take some, then see if you like it. Click here to join the discussion on Discord...
            </p>
          </a>
          <Link href={'/shex-join'} className={styles.card}>
            <h3>Ok, How Do I Join? &rarr;</h3>
            <p>
    You can first try it for free on Stellar test network.
    Add Stellar wallet to your browser, get the assets - and you're in! 
    Click here to join Stellar HEX...
            </p>
          </Link>
        </div>
      </main>
      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel" className={styles.logo}/>
        </a>
      </footer>
    </div>
  </>
  )
}
