import {
  TokenAllocation,
  TokenDistro,
  TokenDistroBalance,
  TransactionTokenAllocation,
} from '../../src/types/schema';
import { Address, BigInt, log } from '@graphprotocol/graph-ts';
import { TokenDistro as TokenDistroContract } from '../../src/types/TokenDistro/TokenDistro';
export function saveTokenAllocation(
  recipient: string,
  txHash: string,
  logIndex: BigInt,
  amount: BigInt,
  timestamp: BigInt,
  tokenDistroAddress: string,
): void {
  let transactionTokenAllocations = TransactionTokenAllocation.load(txHash);
  if (!transactionTokenAllocations) {
    transactionTokenAllocations = new TransactionTokenAllocation(txHash);
  }
  const tokenAllocationIds =
    transactionTokenAllocations.tokenAllocationIds || [];
  const entityId = `${txHash}-${logIndex}`;
  const entity = new TokenAllocation(entityId);
  entity.amount = amount;
  entity.timestamp = timestamp;
  entity.recipient = recipient;
  entity.txHash = txHash;
  entity.tokenDistroAddress = tokenDistroAddress;
  entity.save();
  tokenAllocationIds.push(entityId);
  transactionTokenAllocations.tokenAllocationIds = tokenAllocationIds;
  transactionTokenAllocations.save();
}
export function getTokenDistroBalance(
  tokenDistro: string,
  userAddress: string,
): TokenDistroBalance {
  const id = tokenDistro + '-' + userAddress;
  let tokenDistroBalance = TokenDistroBalance.load(id);

  if (!tokenDistroBalance) {
    tokenDistroBalance = new TokenDistroBalance(id);
    tokenDistroBalance.user = userAddress;
    tokenDistroBalance.tokenDistroAddress = tokenDistro;
    tokenDistroBalance.save();
  }

  return tokenDistroBalance;
}

function getOrUpdateTokenDistro(
  address: Address,
  reFetch: boolean,
): TokenDistro {
  let tokenDistro = TokenDistro.load(address.toHex());

  if (tokenDistro && !reFetch) {
    log.info('Token Distro existed' + address.toHex(), []);
    return tokenDistro;
  }
  if (!tokenDistro) tokenDistro = new TokenDistro(address.toHex());

  const contract = TokenDistroContract.bind(address);
  tokenDistro.lockedAmount = contract.lockedAmount();
  tokenDistro.startTime = contract.startTime();
  tokenDistro.cliffTime = contract.cliffTime();
  tokenDistro.duration = contract.duration();
  tokenDistro.initialAmount = contract.initialAmount();
  tokenDistro.totalTokens = contract.totalTokens();
  tokenDistro.save();
  return tokenDistro;
}

export function getTokenDistro(address: Address): TokenDistro {
  return getOrUpdateTokenDistro(address, false);
}

export function updateTokenDistro(address: Address): TokenDistro {
  return getOrUpdateTokenDistro(address, true);
}

export function updateTokenAllocationDistributor(
  txHash: string,
  distributor: string,
): void {
  const transactionTokenAllocations = TransactionTokenAllocation.load(txHash);
  if (!transactionTokenAllocations) {
    return;
  }
  for (
    let i = 0;
    i < transactionTokenAllocations.tokenAllocationIds.length;
    i++
  ) {
    const entity = TokenAllocation.load(
      transactionTokenAllocations.tokenAllocationIds[i],
    );
    if (!entity) {
      continue;
    }
    entity.distributor = distributor;
    entity.save();
  }
}

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
  claimBalance.save();
}
