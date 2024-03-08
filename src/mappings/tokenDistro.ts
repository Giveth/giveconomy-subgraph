import {
  Allocate,
  Assign,
  Claim,
  GivBackPaid,
  TokenDistro,
  StartTimeChanged,
  ChangeAddress,
  DurationChanged,
  PraiseRewardPaid,
} from '../types/TokenDistro/TokenDistro';
import {
  TokenAllocation,
  TransactionTokenAllocation,
  TokenDistroBalance,
} from '../types/schema';
import { GIVBACK, PRAISE } from '../utils/constants';
import { BigInt, log } from '@graphprotocol/graph-ts';
import {
  addAllocatedTokens,
  addClaimed,
  getTokenDistroBalance,
  saveTokenAllocation,
  updateTokenDistro,
} from '../../src/utils/tokenDistroHelper';

export function handleAllocate(event: Allocate): void {
  saveTokenAllocation(
    event.params.grantee.toHex(),
    event.transaction.hash.toHex(),
    event.transactionLogIndex,
    event.params.amount,
    event.block.timestamp,
    event.address.toHex(),
  );
  addAllocatedTokens(
    event.params.grantee.toHex(),
    event.params.amount,
    event.address.toHex(),
  );
}

export function handleAssign(event: Assign): void {
  updateTokenDistro(event.address);
}

export function handleChangeAddress(event: ChangeAddress): void {
  const oldBalance = getTokenDistroBalance(
    event.address.toHex(),
    event.params.oldAddress.toHex(),
  );
  const newBalance = getTokenDistroBalance(
    event.address.toHex(),
    event.params.newAddress.toHex(),
  );

  // New Address allocatedTokens amount should be zero
  newBalance.allocatedTokens = oldBalance.allocatedTokens;
  oldBalance.allocatedTokens = BigInt.zero();

  // New Address claimed amount should be zero
  newBalance.claimed = oldBalance.claimed;
  oldBalance.claimed = BigInt.zero();

  newBalance.givback = newBalance.givback.plus(oldBalance.givback);
  oldBalance.givback = BigInt.zero();

  newBalance.givbackLiquidPart = newBalance.givbackLiquidPart.plus(
    oldBalance.givbackLiquidPart,
  );
  oldBalance.givbackLiquidPart = BigInt.zero();

  oldBalance.save();
  newBalance.save();
}

export function handleClaim(event: Claim): void {
  addClaimed(
    event.params.grantee.toHex(),
    event.params.amount,
    event.address.toHex(),
  );
}

export function handleGivBackPaid(event: GivBackPaid): void {
  const transactionTokenAllocations = TransactionTokenAllocation.load(
    event.transaction.hash.toHex(),
  );

  if (!transactionTokenAllocations) {
    return;
  }

  const contract = TokenDistro.bind(event.address);
  const globallyClaimableNow = contract.try_globallyClaimableAt(
    event.block.timestamp,
  );
  const totalTokens = contract.totalTokens();

  for (
    let i = 0;
    i < transactionTokenAllocations.tokenAllocationIds.length;
    i++
  ) {
    const tokenAllocation = TokenAllocation.load(
      transactionTokenAllocations.tokenAllocationIds[i],
    );
    if (!tokenAllocation) {
      continue;
    }
    tokenAllocation.givback = true;
    tokenAllocation.distributor = GIVBACK;
    tokenAllocation.save();

    const balance = getTokenDistroBalance(
      tokenAllocation.tokenDistroAddress,
      tokenAllocation.recipient,
    );
    if (!balance) {
      continue;
    }

    balance.givback = balance.givback.plus(tokenAllocation.amount);

    if (!globallyClaimableNow.reverted) {
      balance.givbackLiquidPart = balance.givbackLiquidPart.plus(
        tokenAllocation.amount
          .times(globallyClaimableNow.value)
          .div(totalTokens),
      );
    }

    balance.save();
  }
}

export function handlePraiseRewardPaid(event: PraiseRewardPaid): void {
  const transactionTokenAllocations = TransactionTokenAllocation.load(
    event.transaction.hash.toHex(),
  );

  if (!transactionTokenAllocations) {
    return;
  }

  for (
    let i = 0;
    i < transactionTokenAllocations.tokenAllocationIds.length;
    i++
  ) {
    const tokenAllocation = TokenAllocation.load(
      transactionTokenAllocations.tokenAllocationIds[i],
    );
    if (!tokenAllocation) {
      continue;
    }
    tokenAllocation.praise = true;
    tokenAllocation.distributor = PRAISE;
    tokenAllocation.save();
  }
}

export function handleRoleAdminChanged(): void {}

export function handleRoleGranted(): void {}

export function handleRoleRevoked(): void {}

export function handleStartTimeChanged(event: StartTimeChanged): void {
  updateTokenDistro(event.address);
}

export function handleDurationChanged(event: DurationChanged): void {
  updateTokenDistro(event.address);
}
