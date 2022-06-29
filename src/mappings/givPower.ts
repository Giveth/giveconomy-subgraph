import { BigInt } from '@graphprotocol/graph-ts';
import {
  TokenLocked,
  TokenUnlocked,
  Upgraded,
} from '../types/GIVPower/GIVPower';
import { TokenLock } from '../types/schema';
import {
  getGIVPower,
  getTokenLockId,
  getUserEntity,
  updateGivPower,
} from '../utils/misc';
import { MAX_LOCK_ROUNDS } from '../utils/constants';

export function handleTokenLocked(event: TokenLocked): void {
  const userAddress = event.params.account;
  const lockAmount = event.params.amount;

  const user = getUserEntity(userAddress);
  user.givLocked = user.givLocked.plus(lockAmount);
  user.save();

  const rounds = event.params.rounds;
  const untilRound = event.params.untilRound;

  const lockId = getTokenLockId(userAddress, rounds, untilRound);
  let tokenLock = TokenLock.load(lockId);

  const givPower = getGIVPower(event.address);
  const initialDate = givPower.initialDate;
  const roundDuration = givPower.roundDuration;

  if (tokenLock == null) {
    tokenLock = new TokenLock(lockId);
    tokenLock.user = userAddress.toHex();
    tokenLock.untilRound = untilRound;
    tokenLock.rounds = rounds;
    tokenLock.unlocked = false;
    tokenLock.unlockableAt = initialDate.plus(
      untilRound.plus(BigInt.fromI32(1)).times(roundDuration),
    );
  }

  tokenLock.amount = tokenLock.amount.plus(lockAmount);
  tokenLock.save();

  givPower.locksCreated = givPower.locksCreated.plus(BigInt.fromI32(1));
  givPower.totalGIVLocked = givPower.totalGIVLocked.plus(lockAmount);

  givPower.save();
}

export function handleTokenUnlocked(event: TokenUnlocked): void {
  const userAddress = event.params.account;
  const unlockAmount = event.params.amount;

  const user = getUserEntity(userAddress);
  user.givLocked = user.givLocked.minus(unlockAmount);
  user.save();

  const givpower = getGIVPower(event.address);
  givpower.totalGIVLocked = givpower.totalGIVLocked.minus(unlockAmount);
  givpower.save();

  const round = event.params.round;
  for (let i = 0; i <= MAX_LOCK_ROUNDS; i += 1) {
    const lockId = getTokenLockId(userAddress, BigInt.fromI32(i), round);
    const tokenLock = TokenLock.load(lockId);
    if (tokenLock) {
      tokenLock.unlockedAt = event.block.timestamp;
      tokenLock.amount = BigInt.zero();
      tokenLock.unlocked = true;
      tokenLock.save();
    }
  }
}

export function handleUpgrade(event: Upgraded): void {
  updateGivPower(event.address);
}
