import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export function scaleDown(num: BigInt): BigDecimal {
  return num.divDecimal(BigInt.fromI32(10).pow(u8(18)).toBigDecimal());
}
