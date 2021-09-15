import React from 'react'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { AlertTriangle } from 'react-feather'
import { AutoColumn } from '../Column'
import { ButtonPrimary } from '../Button'
import { useActiveWeb3React } from '../../hooks'
import Modal from '../Modal'

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

const BottomSection = styled(Section)`
  background-color: ${({ theme }) => theme.bg2};
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
`
const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 14px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

export function ConfirmationModalContent({
  title,
  onDismiss,
  message
}) {
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={20}>
            {title}
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        {message}
      </Section>
    </Wrapper>
  )
}

export function TransactionErrorModal({ message, isOpen, onDismiss }) {
  const { chainId } = useActiveWeb3React()

  console.log(message);

  if (!chainId) return null

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      <Wrapper>
        <Section>
          <RowBetween>
            <Text fontWeight={500} fontSize={20}>
              Error
          </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <AutoColumn style={{ marginTop: 20, padding: '2rem 0' }} gap="24px" justify="center">
            <AlertTriangle color='#FD4040' style={{ strokeWidth: 1.5 }} size={64} />
            <Text fontWeight={500} fontSize={16} color='#FD4040' style={{ textAlign: 'center', width: '85%' }}>
              {message}
            </Text>
          </AutoColumn>
        </Section>
        <BottomSection gap="12px">
          <ButtonPrimary onClick={onDismiss}>Dismiss</ButtonPrimary>
        </BottomSection>
      </Wrapper>
    </Modal>
  )
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  content
}) {
  console.log(content())
  const { chainId } = useActiveWeb3React()

  if (!chainId) return null

  // confirmation screen
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      {(
        content()
      )}
    </Modal>
  )
}