import { BigInt } from '@graphprotocol/graph-ts';
import { getTokenDistroBalance } from '../utils/misc';

export function addAllocatedTokens(
  to: string,
  value: BigInt,
  tokenAddress: string,
): void {
  const allocatedBalance = getTokenDistroBalance(tokenAddress, to);
  allocatedBalance.allocatedTokens =
    allocatedBalance.allocatedTokens.plus(value);
  allocatedBalance.allocationCount = allocatedBalance.allocationCount.plus(
    BigInt.fromI32(1),
  );
  allocatedBalance.save();
}

export function addClaimed(
  to: string,
  value: BigInt,
  tokenAddress: string,
): void {
  const claimBalance = getTokenDistroBalance(tokenAddress, to);
  claimBalance.claimed = claimBalance.claimed.plus(value);
  claimBalance.givback = BigInt.zero();
  claimBalance.givbackLiquidPart = BigInt.zero();
  claimBalance.givDropClaimed = false;
  claimBalance.user = to;
  claimBalance.save();
}
