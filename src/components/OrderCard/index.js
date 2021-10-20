import React, { useState } from 'react'
import { ethers } from 'ethers'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useWeb3React } from '@web3-react/core'
// import Tooltip from '@reach/tooltip'
import { getEtherscanLink } from '../../utils'
import { CurrencySelect, Aligner, StyledTokenName } from '../CurrencyInputPanel'
import TokenLogo from '../TokenLogo'
import ArrowDown from '../../assets/svg/SVGArrowDown'
import { amountFormatter } from '../../utils'
import { useSymphonyContract } from '../../hooks'
// import { useTradeExactIn } from '../../hooks/trade'
import { useTokenDetails } from '../../contexts/Tokens'
// import { useGasPrice } from '../../contexts/GasPrice'
import {
  ACTION_PLACE_ORDER,
  ACTION_CANCEL_ORDER,
  useTransactionAdder,
  useOrderPendingState
} from '../../contexts/Transactions'
import { ETH_ADDRESS } from '../../constants'
import { getExchangeRate } from '../../utils/rate'

import './OrderCard.css'
import { getGasPrice } from '../../utils/gas'

const CancelButton = styled.div`
  color: ${({ selected, theme }) => (selected ? theme.textColor : theme.textColor)};
  padding: 0px 6px 0px 6px;
  font-size: 0.85rem;
`

const Order = styled.div`
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-flow: column nowrap;
  -ms-flex-flow: column nowrap;
  flex-flow: column nowrap;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.05);
  position: relative;
  border-radius: 1.25rem;
  z-index: 1;
  padding: 20px;
  margin-bottom: 40px;
  border: ${({ theme }) => `1px solid ${theme.mercuryGray}`};
  background-color: ${({ theme }) => theme.concreteGray};
`

const Spacer = styled.div`
  flex: 1 1 auto;
`
const WrappedArrowRight = ({ clickable, active, ...rest }) => <ArrowDown {...rest} transform="rotate(-90)" />

const RightArrow = styled(WrappedArrowRight)`
  color: ${({ theme }) => theme.royalGreen};
  width: 0.625rem;
  height: 0.625rem;
  position: relative;
`

export function OrderCard(props) {
  const { t } = useTranslation()
  const { chainId } = useWeb3React()

  const order = props.order
  // const inputAssetDetails = props.inputAssetDetails[0]

  const inputToken = order.inputToken === ETH_ADDRESS.toLowerCase() ? 'ETH' : ethers.utils.getAddress(order.inputToken)
  const outputToken =
    order.outputToken === ETH_ADDRESS.toLowerCase() ? 'ETH' : ethers.utils.getAddress(order.outputToken)

  const { symbol: fromSymbol, decimals: fromDecimals } = useTokenDetails(inputToken)
  const { symbol: toSymbol, decimals: toDecimals } = useTokenDetails(outputToken)
  const { state, last } = useOrderPendingState(order)

  const canceling = state === ACTION_CANCEL_ORDER
  const pending = state === ACTION_PLACE_ORDER

  const symphonyContract = useSymphonyContract()
  const addTransaction = useTransactionAdder()

  async function onCancel(order, pending) {
    const { orderId, orderEncodedData } = order
    const gasPrice = await getGasPrice();
    let gasLimit = await symphonyContract.estimateGas.cancelOrder(
      orderId,
      orderEncodedData,
      {
        gasPrice
      }
    );
    gasLimit = gasLimit.add(ethers.BigNumber.from(50000))

    symphonyContract
      .cancelOrder(
        orderId,
        orderEncodedData,
        {
          gasLimit,
          gasPrice,
        }
      )
      .then(response => {
        addTransaction(response, { action: ACTION_CANCEL_ORDER, order: order })
      });
  }

  const inputAmount = ethers.BigNumber.from(
    order.inputAmount !== '0' || !order.creationAmount ? order.inputAmount : order.creationAmount
  )
  const minReturnAmount = ethers.BigNumber.from(order.minReturnAmount)
  const stoplossAmount = ethers.BigNumber.from(order.stoplossAmount)

  const explorerLink = last ? getEtherscanLink(chainId, last.response.hash, 'transaction') : undefined

  const rateFromTo = getExchangeRate(inputAmount, fromDecimals, minReturnAmount, toDecimals, false)
  const rateToFrom = getExchangeRate(inputAmount, fromDecimals, minReturnAmount, toDecimals, true)

  const [yieldEarned, setYieldEarned] = useState("");

  const checkYield = async () => {
    const totalFunds = await symphonyContract.getTotalFunds(order.inputToken);
    const totalShares = await symphonyContract.totalAssetShares(order.inputToken);

    const currentOrderValue = Number(totalFunds) > 0 ?
      ethers.BigNumber.from(order.shares)
        .mul(ethers.BigNumber.from(totalFunds))
        .div(ethers.BigNumber.from(totalShares))
      : ethers.BigNumber.from("0");

    const yieldEarned = currentOrderValue.gt(0) ? currentOrderValue.sub(inputAmount) : ethers.BigNumber.from("0");
    setYieldEarned(yieldEarned);
  }

  // const gasPrice = useGasPrice()
  // const gasLimit = GENERIC_GAS_LIMIT_ORDER_EXECUTE
  // const requiredGas = gasPrice?.mul(gasLimit)

  // const gasInInputTokens = useTradeExactIn('ETH', amountFormatter(requiredGas, 18, 18), inputToken)

  // let tooltipText = ''
  // let executionRateText = ''

  // try {
  //   const [virtualRateFromTo, virtualRateToFrom] = useMemo(() => {
  //     if (!gasPrice) return [undefined, undefined]

  //     let usedInput

  //     try {
  //       if (inputToken === 'ETH') {
  //         usedInput = requiredGas
  //       } else if (!gasInInputTokens || !requiredGas) {
  //         return [undefined, undefined]
  //       } else {
  //         usedInput = ethers.utils.parseUnits(gasInInputTokens.outputAmount.toExact(), fromDecimals)
  //       }

  //       return [
  //         getExchangeRate(inputAmount.sub(usedInput), fromDecimals, minReturnAmount, toDecimals, false),
  //         getExchangeRate(inputAmount.sub(usedInput), fromDecimals, minReturnAmount, toDecimals, true)
  //       ]
  //     } catch {
  //       return [undefined, undefined]
  //     }
  //   }, [fromDecimals, inputAmount, minReturnAmount, requiredGas, toDecimals, inputToken, gasInInputTokens, gasPrice])

  //   if (virtualRateFromTo?.gt(ethers.constants.Zero)) {
  //     executionRateText = `Execution rate: ${virtualRateFromTo ? amountFormatter(virtualRateFromTo, 18, 3) : '...'
  //       } ${fromSymbol}/${toSymbol} -
  //       ${virtualRateToFrom ? amountFormatter(virtualRateToFrom, 18, 3) : '...'} ${toSymbol}/${fromSymbol}* `
  //   } else if (virtualRateFromTo) {
  //     executionRateText = 'Execution rate: never executes'
  //   } else {
  //     executionRateText = ''
  //   }

  //   tooltipText = `Required rate to execute order assuming gas price of ${gasPrice ? amountFormatter(gasPrice, 9, 2) : '...'
  //     } GWEI`
  // } catch (e) {
  //   console.warn('Error computing virtual rate', e)
  // }
  return (
    <Order className={`order ${order.status}`}>
      <div className="tokens">
        <CurrencySelect selected={true}>
          <Aligner>
            {<TokenLogo address={inputToken} logoURI="" />}
            {<StyledTokenName>{fromSymbol}</StyledTokenName>}
          </Aligner>
        </CurrencySelect>
        <Aligner>
          <RightArrow transform="rotate(-90)" />
        </Aligner>
        <CurrencySelect selected={true}>
          <Aligner>
            {<TokenLogo address={outputToken} logoURI="" />}
            {<StyledTokenName>{toSymbol}</StyledTokenName>}
          </Aligner>
        </CurrencySelect>
        <Spacer />
        <CurrencySelect
          selected={true}
          disabled={canceling}
          onClick={() => onCancel(order, pending)}
        >
          <CancelButton>{
            canceling &&
              last &&
              last.response.CUSTOM_DATA.order.orderId === order.orderId
              ? 'Cancelling ...'
              : t('cancel')}
          </CancelButton>
        </CurrencySelect>
      </div>{' '}
      <p>
        {`Sell: ${amountFormatter(inputAmount, fromDecimals, 6)}`} {fromSymbol}
      </p>
      <p>
        {`Receive: ${amountFormatter(minReturnAmount, toDecimals, 6)}`} {toSymbol}
      </p>
      <p>
        {`Stoploss: ${amountFormatter(stoplossAmount, toDecimals, 6)}`} {toSymbol}
      </p>
      <p>
        {`Rate: ${amountFormatter(rateFromTo, 18, 6)}`} {fromSymbol}/{toSymbol} - {amountFormatter(rateToFrom, 18, 6)}{' '}
        {toSymbol}/{fromSymbol}
      </p>
      <p>
        <span>Yield Earned: &nbsp;</span>
        <span>
          {yieldEarned > 0 ?
            <span>{`${amountFormatter(yieldEarned, fromDecimals, 6)}`} {fromSymbol} + Extra WMATIC (Aave)</span>
            :
            <span
              selected={true}
              onClick={() => checkYield()}
              style={{ cursor: 'pointer', textDecoration: 'underline', color: "#87c122" }}
            >
              check
            </span>
          }
        </span>
      </p>
      {/* <Tooltip
        label={tooltipText}
        style={{
          background: 'hsla(0, 0%, 0%, 0.75)',
          color: 'white',
          border: 'none',
          borderRadius: '24px',
          padding: '0.5em 1em',
          marginTop: '-64px'
        }}
      >
        <p>{executionRateText}</p>
      </Tooltip> */}
      <p>
        {last &&
          last.response.CUSTOM_DATA.order.orderId === order.orderId
          && (
            <a rel="noopener noreferrer" target="_blank" href={explorerLink} className="order-link">
              Pending transaction...
            </a>
          )}
      </p>
    </Order>
  )
}
