# Stellar Help Exchange

This is work in progress.

## Presentation

### [YouTube Video](https://youtu.be/y4TELgx28D4)

### [Google Slideshow](https://docs.google.com/presentation/d/1Gq_d3q19xkDIenS_KM-PEKy7r3rBkAyOMJJWVPPb2Us)

## Proof-of-Concept Demo

### [YouTube Video](https://youtu.be/QShlI8aNDgs)

### Log Data

Here is the relevant part of the PoC Demo log data:

```
- Fri Apr 21 2023 22:45:20 GMT+0000 (Coordinated Universal Time), /home/ubuntu/people/didalik/aim/shex/shared-services-support-repos/shex/bin/watchABC.mjs started: network test
+ 4123 ms: addHEXuser: Ann GAS4L57AZNBP3RBSRGDXWRNMCWSKMG3JYN5VUACGZUZW3U5DFMCBC3KF
+ 4263 ms: addHEXuser: Ben GAK463KUUSSZB5SIDPODGUH6GGAUWKSYGUXXHUPXAGVUWMFX27F6MQOA
+ 5733 ms: addHEXuser: Cyn GDHRU7KKU2FZ6UDV3FZR7LLARXBYR3XTOPZORML6HPB6TZFBCEXPX2U7
+ 4088 ms: setupCheckCompletion Ann SCEWXMPENY3J2WUBDDL3QMAPPQYEZV324RNX4DVAACFR5V2SZZB5JTGA
+ 0 ms: setupCheckCompletion Ben SCZPH7K6ZGTQCRLWRBUH64ED3APJTDYAQTBIIQBJPBC2YNVXEGTEADFP
+ 1 ms: setupCheckCompletion Cyn SCB6VFJQOPZEHQZFTHUF6FQYZV6EH5USFRLMY3CTBFYUFO6KVDGSDUX7
+ 164 ms: Ben acquiring lock
+ 26 ms: Ann acquiring lock 
+ 4806 ms: Ben releasing lock offer tx fd55111abae113c746743d470693de209f2775a455d75f8c8aa80b43e7e0bfcf
+ 2717 ms: Cyn acquiring lock for make tx fd55111abae113c746743d470693de209f2775a455d75f8c8aa80b43e7e0bfcf
+ 3031 ms: Ann releasing lock request tx bf6dc96a096f8586b458cb133e2f7173406a24595b3006a25d9fde79e7950177
+ 1947 ms: Cyn acquiring lock for make tx bf6dc96a096f8586b458cb133e2f7173406a24595b3006a25d9fde79e7950177
+ 4307 ms: Cyn releasing lock for make tx fd55111abae113c746743d470693de209f2775a455d75f8c8aa80b43e7e0bfcf
+ 0 ms: Cyn take tx 3db84f0c01ae0b12411c10dba24c19dce7f4e74964221b7f45840a4bf54ed014 balanceId 000000009849a185f31770ad3d3d170411c6c4bee59aef20fa57e07395b0717be052e273
+ 3478 ms: Ben has a take on his make tx fd55111abae113c746743d470693de209f2775a455d75f8c8aa80b43e7e0bfcf
+ 2 ms: Ben claims Cyn's take on Ben's offer 800.0000000 000000009849a185f31770ad3d3d170411c6c4bee59aef20fa57e07395b0717be052e273
+ 0 ms: Ben claims Cyn's take takerTxId 3db84f0c01ae0b12411c10dba24c19dce7f4e74964221b7f45840a4bf54ed014
+ 175 ms: Ben acquiring lock 
+ 2086 ms: Cyn releasing lock for make tx bf6dc96a096f8586b458cb133e2f7173406a24595b3006a25d9fde79e7950177
+ 0 ms: Cyn take tx 553833b8bfbb4a8c52cab9be63c39c9309d5c60619c67ac5a5a68f8ddb529d54 balanceId 000000006165286d06c75537ea6139801d7271c2efe41a5aa28f68eed0972a8cfe84a7ba
+ 3176 ms: Ann claims Cyn's take on Ann's request 0.0000100 000000006165286d06c75537ea6139801d7271c2efe41a5aa28f68eed0972a8cfe84a7ba
+ 492 ms: Ann acquiring lock
+ 1068 ms: made take taken transaction 3db84f0c01ae0b12411c10dba24c19dce7f4e74964221b7f45840a4bf54ed014
+ 519 ms: Ben releasing lock claim tx 93855d3c035f911cc184fc80b821887331ef380e8c5afad1cf0cb62ef5c60ae8
+ 4480 ms: made take taken transaction 553833b8bfbb4a8c52cab9be63c39c9309d5c60619c67ac5a5a68f8ddb529d54
+ 1 ms: made take taken request amount 1000.0000100
+ 516 ms: Ann releasing lock claim tx 1534e484e86bf1953fbde83545e59b5636ee605984eda277efaedff43ada4c7c
+ 4856 ms: Agent acquiring lock to convert amount 800.0000000 for paymentId 3db84f0c01ae0b12411c10dba24c19dce7f4e74964221b7f45840a4bf54ed014
+ 146 ms: Ben is converting ClawableHexa 800.0000000 balanceId 0000000077c365dd82e86362e5594bcf73307967896c7facc0017be07b7012fa6972891a
+ 4748 ms: Agent releasing lock converted tx 9759df788e777bf54613e089f2e4b3084c5729a0062a3471b16dc5469b7cc2c0
+ 4696 ms: effect4ich takeId 1534e484e86bf1953fbde83545e59b5636ee605984eda277efaedff43ada4c7c
+ 321 ms: issuerCH acquiring lock
+ 236 ms: Ann requested repay balanceId 000000001fda55441ec729e65c9c9c1a779775dfaab5ce4fc382b205c310841873d7b7ed
+ 0 ms: Ann requested repay for tx 1534e484e86bf1953fbde83545e59b5636ee605984eda277efaedff43ada4c7c
+ 4746 ms: issuerCH releasing lock repaid tx 9dbb9a1cdf6e61f00e4c7caaaa1a9e6989154c5b4ca16a9a269a0c7faf5f6a5c
+ 5000 ms: pk GAK463KUUSSZB5SIDPODGUH6GGAUWKSYGUXXHUPXAGVUWMFX27F6MQOA reclaim claimed txId 0aac18a01bd9591a8c20b4e15e0f7adbc39f627cf759b62684f49ff6e4d418bb
+ 5002 ms: pk GAS4L57AZNBP3RBSRGDXWRNMCWSKMG3JYN5VUACGZUZW3U5DFMCBC3KF reclaim claimed txId 74f0acd1980eab9894992bcb3f7b1b1d3b1d7e28bcfae8699d474de8759eadfa
+ 21000 ms: pk GAS4L57AZNBP3RBSRGDXWRNMCWSKMG3JYN5VUACGZUZW3U5DFMCBC3KF reclaim claimed txId f27342f07b82e3674d3125533456e33a2681e6565ec2fa190f4335cfede426e3
+ 11250 ms: removeAccount txR.id 37156f52c6994f4c5c45736746bb037daf0445700c590ac99a83d4a2610215c4
+ 1 ms: teardown removed Ann's account
+ 4750 ms: removeAccount txR.id b8108051346ec284f69ce498697d344392e04e6060002e23187442f55f0e8c19
+ 0 ms: teardown removed Ben's account
+ 6002 ms: removeAccount txR.id 09ab74bf276af199dd9d5ba14e7cbadda143ddbe798cec146b6b634ae15b6cf6
+ 0 ms: teardown removed Cyn's account
```

## How It Works

