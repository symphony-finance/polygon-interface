import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useWeb3React } from '@web3-react/core'
// import * as ls from 'local-storage'
import styled from 'styled-components'

import { isAddress } from '../../utils'
import { OrderCard } from '../OrderCard'
import Circle from '../../assets/images/circle.svg'
// import { useSymphonyContract } from '../../hooks'
import { OrdersHistory } from '../OrdersHistory'
import { Spinner } from '../../theme'
import { useAllPendingOrders, useAllPendingCancelOrders } from '../../contexts/Transactions'
import { ORDER_GRAPH } from '../../constants'

const SpinnerWrapper = styled(Spinner)`
  margin: 0 0.25rem 0 0.25rem;
`

// ///
// Local storage
// ///
// const LS_ORDERS = 'orders_'

// function lsKey(key, account, chainId) {
//   return key + account.toString() + chainId
// }

// function getSavedOrders(account, chainId) {
//   if (!account) return []

//   console.log('Loading saved orders from storage location', account, lsKey(LS_ORDERS, account, chainId))
//   const raw = ls.get(lsKey(LS_ORDERS, account, chainId))
//   return raw == null ? [] : raw
// }

async function fetchUserOrders(account, chainId) {
  const query = `
  query GetOrdersByOwner($owner: String) {
    orders(
      where:{recipient:$owner,status:ACTIVE},
      orderBy: createdAtBlock, 
      orderDirection: desc
    ) {
      id
      orderId
      recipient {
        id
      }
      inputToken
      outputToken
      inputAmount
      minReturnAmount
      stoplossAmount
      orderEncodedData
      shares
      createdAtBlock
    }
  }`
  try {
    const res = await fetch(ORDER_GRAPH[chainId], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { owner: account.toLowerCase() } }),
    })

    const { data } = await res.json()

    return {
      allOrders: [],
      openOrders: data.orders,
    }
  } catch (e) {
    console.warn('Error loading orders from TheGraph', e)
    return {
      allOrders: [],
      openOrders: [],
    }
  }
}

// async function getAllAssetsDetail(chainId) {
//   const query = `
//   query {
//     assetDetails {
//       asset
//       totalFunds
//       totalShares
//     }
//   }`
//   try {
//     const res = await fetch(ORDER_GRAPH[chainId], {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ query }),
//     })

//     const { data } = await res.json()

//     return data.assetDetails
//   } catch (e) {
//     console.warn('Error loading orders from TheGraph', e)
//     return []
//   }
// }

function useGraphOrders(account, chainId, deps = []) {
  const [state, setState] = useState({ openOrders: [], allOrders: [], assetDetails: [] })

  useEffect(() => {
    console.log(`Requesting load orders from the graph`)
    if (account && isAddress(account)) {
      setTimeout(() => {
        fetchUserOrders(account, chainId).then(async (orders) => {
          console.log(`Fetched ${orders.allOrders.length} ${orders.openOrders.length} orders from the graph`)

          // const allAssetDetails = await getAllAssetsDetail(chainId)
          setState({
            // allAssetDetails,
            allOrders: orders.allOrders,
            openOrders: orders.openOrders,
          })
        })
      }, 4000)
    }
    // eslint-disable-next-line
  }, [...deps, account, chainId])

  return state
}

// function useSavedOrders(account, chainId, symphonyContract, deps = []) {
//   const [state, setState] = useState({ allOrders: [], openOrders: [] })

//   useEffect(() => {
//     console.log(`Requesting load orders from storage`)
//     if (isAddress(account)) {
//       const allOrders = getSavedOrders(account, chainId)
//       // console.log(`Loaded ${allOrders.length} orders from local storage`)
//       if (allOrders.length > 0) {
//         setState({
//           allOrders: allOrders,
//           openOrders: allOrders.filter((o) => o.inputAmount !== '0'),
//         })
//       }
//     }
//     // eslint-disable-next-line
//   }, [...deps, account, chainId, symphonyContract])

//   return state
// }

export default function Orders() {
  const { t } = useTranslation()
  const { account, chainId } = useWeb3React()
  // const symphonyContract = useSymphonyContract()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(!account)
  }, [account])

  let pendingOrders = useAllPendingOrders()
  let pendingCancelOrders = useAllPendingCancelOrders()

  // Get locally saved orders and the graph orders
  // const local = useSavedOrders(account, chainId, symphonyContract, [pendingOrders.length, pendingCancelOrders.length])

  // TODO: Remove deps if necessary
  const graph = useGraphOrders(account, chainId, [pendingOrders.length, pendingCancelOrders.length])

  // Define orders to show as openOrders + pending orders
  useEffect(() => {
    // Aggregate graph and local orders, local orders have priority
    // const allOrders = local.allOrders.concat(
    //   graph.allOrders.filter((o) => !local.allOrders.find((c) => c.orderId === o.orderId))
    // )
    // const openOrders = local.openOrders.concat(
    //   graph.openOrders.filter((o) => !local.allOrders.find((c) => c.orderId === o.orderId))
    // )

    // setOrders(openOrders.concat(allOrders.filter((o) => pendingOrders.find((p) => p.orderId === o.orderId))))
    setOrders(graph.openOrders)
    // eslint-disable-next-line
  }, [
    // local.allOrders.length,
    // local.openOrders.length,
    // graph.allOrders.length,
    graph.openOrders.length,
    pendingOrders.length,
  ])

  return (
    <>
      {account && (
        <>
          <>
            <p className="orders-title">{`${t('Orders')} ${orders.length > 0 ? `(${orders.length})` : ''}`}</p>
            {loading && (
              <>
                <SpinnerWrapper src={Circle} alt="loader" /> Loading ...
                <br />
                <br />
              </>
            )}
            {orders.length === 0 && !loading && <p>{t('noOpenOrders')}</p>}
            {
              <div>
                {orders.map((order) => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    // inputAssetDetails={graph.allAssetDetails.filter(
                    //   (assetDetails) => assetDetails.asset.toLowerCase() === order.inputToken.toLowerCase()
                    // )}
                  />
                ))}
              </div>
            }
          </>
          <OrdersHistory />
        </>
      )}
    </>
  )
}
