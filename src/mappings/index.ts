import { PowerLocked, PowerUnlocked } from '../types/GIVPower/GIVPower';
import { PowerLock } from '../types/schema';
import { ROUND_IN_SEC } from '../utils/constants';
import { scaleDown } from '../utils/math';
import { getUserEntity } from '../utils/misc';

export function handlePowerLocked(event: PowerLocked): void {
  const userAddress = event.params.account;
  const powerAmount = scaleDown(event.params.powerAmount);
  const user = getUserEntity(userAddress);
  user.givPower = user.givPower.plus(powerAmount);
  user.save();

  const txHash = event.transaction.hash.toHex();
  const rounds = event.params.rounds.toI32();
  const untilRound = event.params.untilRound.toI32();
  const unlockableAt = event.block.timestamp.toI32() + rounds * ROUND_IN_SEC;

  const powerLock = new PowerLock(txHash);
  powerLock.user = userAddress.toHex();
  powerLock.amount = powerAmount;
  powerLock.untilRound = untilRound;
  powerLock.unlockableAt = unlockableAt;
  powerLock.rounds = rounds;
  powerLock.locked = true;
  powerLock.save();
}

export function handlePowerUnlocked(event: PowerUnlocked): void {
  const userAddress = event.params.account;
  const powerAmount = scaleDown(event.params.powerAmount);
  const user = getUserEntity(userAddress);
  user.givPower = user.givPower.minus(powerAmount);
  user.save();

  // TODO: Unlock PowerLock entities below
}
