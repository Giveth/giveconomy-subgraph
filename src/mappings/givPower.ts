import { BigInt } from '@graphprotocol/graph-ts';
import {
  TokenLocked,
  TokenUnlocked,
  Upgraded,
  Transfer,
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

  const rounds = event.params.rounds.toI32();
  const untilRound = event.params.untilRound.toI32();

  const lockId = getTokenLockId(userAddress, rounds, untilRound);
  let tokenLock = TokenLock.load(lockId);

  const givPower = getGIVPower(event.address);
  const initialDate = givPower.initialDate;
  const roundDuration = givPower.roundDuration;

  if (tokenLock == null) {
    tokenLock = new TokenLock(lockId);
    tokenLock.user = userAddress.toHex();
    tokenLock.amount = BigInt.zero();
    tokenLock.untilRound = untilRound;
    tokenLock.rounds = rounds;
    tokenLock.unlocked = false;
    tokenLock.unlockableAt = initialDate.plus(
      BigInt.fromI64((untilRound + 1) * roundDuration),
    );
  }

  tokenLock.amount = tokenLock.amount.plus(lockAmount);
  tokenLock.save();

  givPower.locksCreated += 1;
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

  const round = event.params.round.toI32();
  for (let i = 0; i <= MAX_LOCK_ROUNDS; i += 1) {
    const lockId = getTokenLockId(userAddress, i, round);
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
