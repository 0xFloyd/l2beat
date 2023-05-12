import { Bytes, ContractValue } from '@l2beat/common'

import { valueToBigInt } from './valueToBigInt'

export function valueToNumber(value: bigint | Bytes | ContractValue) {
  const bigint = valueToBigInt(value)
  if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
    throw new Error('Cannot convert value to number')
  }
  return Number(bigint)
}
