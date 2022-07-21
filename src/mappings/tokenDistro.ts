import {
  Allocate,
  Assign,
  Claim,
  GivBackPaid,
  TokenDistro,
  StartTimeChanged,
} from '../types/TokenDistro/TokenDistro';
import { saveTokenAllocation } from '../utils/misc';
import { addAllocatedTokens, addClaimed } from '../commons/BalanceHandler';
import {
  createTokenDistroContractInfoIfNotExists,
  createOrUpdateTokenDistroContractInfo,
} from '../commons/TokenDistroHandler';
import {
  TokenAllocation,
  TransactionTokenAllocation,
  TokenDistroBalance,
} from '../types/schema';
import { GIVBACK } from '../utils/constants';

export function handleAllocate(event: Allocate): void {
  saveTokenAllocation(
    event.params.grantee.toHex(),
    event.transaction.hash.toHex(),
    event.transactionLogIndex,
    event.params.amount,
    event.block.timestamp,
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

export function handleChangeAddress(): void {}

export function handleClaim(event: Claim): void {
  addClaimed(
    event.params.grantee.toHex(),
    event.params.amount,
    event.params.grantee.toHex(),
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
  createOrUpdateTokenDistroContractInfo(event.address);
}
