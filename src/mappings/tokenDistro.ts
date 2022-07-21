import { Allocate, Assign, Claim } from '../types/TokenDistro/TokenDistro';
import { saveTokenAllocation } from '../utils/misc';
import { addAllocatedTokens, addClaimed } from '../commons/BalanceHandler';
import { createTokenDistroContractInfoIfNotExists } from '../commons/TokenDistroHandler';

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

export function handleGivBackPaid(): void {}

export function handleRoleAdminChanged(): void {}

export function handleRoleGranted(): void {}

export function handleRoleRevoked(): void {}

export function handleStartTimeChanged(): void {}
