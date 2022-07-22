import {
  Allocate,
  Assign,
  Claim,
  GivBackPaid,
  TokenDistro,
  StartTimeChanged,
  ChangeAddress,
} from '../types/TokenDistro/TokenDistro';
import { saveTokenAllocation } from '../utils/misc';
import { addAllocatedTokens, addClaimed } from '../commons/BalanceHandler';
import {
  createTokenDistroContractInfoIfNotExists,
  createOrUpdateTokenDistro,
} from '../commons/TokenDistroHandler';
import {
  TokenAllocation,
  TransactionTokenAllocation,
  TokenDistroBalance,
} from '../types/schema';
import { GIVBACK } from '../utils/constants';
import { BigInt, log } from '@graphprotocol/graph-ts';

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
    event.params.distributor.toHex(),
  );
}

export function handleAssign(event: Assign): void {
  createTokenDistroContractInfoIfNotExists(event.address);
}

export function handleChangeAddress(event: ChangeAddress): void {
  const oldBalance = TokenDistroBalance.load(event.params.oldAddress.toHex());
  if (!oldBalance) {
    log.debug('Change Address oldAddress {} balance is null!', [
      event.params.oldAddress.toHex(),
    ]);
    return;
  }
  let newBalance = TokenDistroBalance.load(event.params.newAddress.toHex());
  if (!newBalance) {
    newBalance = new TokenDistroBalance(event.params.newAddress.toHex());
  }

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
    const balance = TokenDistroBalance.load(tokenAllocation.recipient);
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

export function handleRoleAdminChanged(): void {}

export function handleRoleGranted(): void {}

export function handleRoleRevoked(): void {}

export function handleStartTimeChanged(event: StartTimeChanged): void {
  createOrUpdateTokenDistro(event.address);
}
