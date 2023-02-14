import Head from 'next/head'
import Link from 'next/link';
import styles from './index.module.css'

export default function Home() {
  const title = 'Trade HEXA@XLM'
  const onSubmit = event => {
    event.preventDefault()
    alert(event.target.order.value)
  }
  return (
  <>
    <Head>
      <title>{title}</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className={styles.container}>
      <h1 className={styles.description}>{title}</h1>
      <label>Orderbook</label>
      <textarea rows={4} cols={80}/>
      <form onSubmit={onSubmit}>
      <label>Place order: </label>
      <input 
    type='text' id='order' required 
    pattern='^[bs]\d{1,3}(\.\d{1,6})?@\d{1,3}(\.\d{1,6})?$' 
      title='^[bs]\d{1,3}(\.\d{1,6})?@\d{1,3}(\.\d{1,6})?$'
      />
      <button type="submit"> Place</button>
      </form>
      <label>Your order(s)</label>
      <textarea rows={4} cols={80}/>
    </div>
  </>
  )
}
