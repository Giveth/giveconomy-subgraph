import { Address, BigInt } from '@graphprotocol/graph-ts';
import { getTokenDistroBalance } from '../utils/misc';

export function addAllocatedTokens(
  to: string,
  value: BigInt,
  tokenAddress: Address,
  tokenDistroAddress: string,
): void {
  const allocatedBalance = getTokenDistroBalance(tokenAddress);
  allocatedBalance.allocatedTokens =
    allocatedBalance.allocatedTokens.plus(value);
  allocatedBalance.allocationCount = allocatedBalance.allocationCount.plus(
    BigInt.fromI32(1),
  );
  allocatedBalance.tokenDistroAddress = tokenDistroAddress;
  allocatedBalance.user = to;
  allocatedBalance.save();
}

export function addClaimed(
  to: string,
  value: BigInt,
  tokenAddress: Address,
): void {
  const claimBalance = getTokenDistroBalance(tokenAddress);
  claimBalance.claimed = claimBalance.claimed.plus(value);
  claimBalance.givback = BigInt.zero();
  claimBalance.givbackLiquidPart = BigInt.zero();
  claimBalance.user = to;
  claimBalance.save();
}
