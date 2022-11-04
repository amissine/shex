import React from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { WalletData } from '../components/molecules'

const Home: NextPage = _ => {
  return (
    <>
      <Head>
        <title>Stellar HEX</title>
        <meta
          name="description"
          content="An introduction to Stellar Help Exchange"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h3>Stellar Help Exchange</h3>
        <WalletData />
      </header>
      <main className={styles.main}>
        <div className={styles.content}>
          XA
        </div>
      </main>
    </>
  )
}

export default Home
