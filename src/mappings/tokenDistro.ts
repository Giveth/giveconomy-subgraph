import { Allocate } from '../types/TokenDistro/TokenDistro';
import { saveTokenAllocation, addAllocatedTokens } from '../utils/misc';

export function handleAllocate(event: Allocate): void {
  saveTokenAllocation(
    event.params.grantee.toHex(),
    event.transaction.hash.toHex(),
    event.transactionLogIndex,
    event.params.amount,
    event.block.timestamp,
  );
  addAllocatedTokens(event.params.grantee.toHex(), event.params.amount);
}

export function handleAssign(): void {}

export function handleChangeAddress(): void {}

export function handleClaim(): void {}

export function handleGivBackPaid(): void {}

export function handleRoleAdminChanged(): void {}

export function handleRoleGranted(): void {}

export function handleRoleRevoked(): void {}

export function handleStartTimeChanged(): void {}
