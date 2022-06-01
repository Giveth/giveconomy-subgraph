import {
  GIVPower,
  PowerLocked,
  PowerUnlocked,
} from '../types/GIVPower/GIVPower';
import { PowerLock } from '../types/schema';
import { GIVPOWER_ADDRESS } from '../utils/constants';
import { scaleDown } from '../utils/math';
import { getUserEntity } from '../utils/misc';

export function handlePowerLocked(event: PowerLocked): void {
  const userAddress = event.params.account;
  const powerAmount = scaleDown(event.params.powerAmount);
  const user = getUserEntity(userAddress);
  user.givPower = user.givPower.plus(powerAmount);
  user.save();

  let initialDate: i32;
  let roundDuration: i32;

  const givpower = GIVPower.bind(GIVPOWER_ADDRESS);
  const initialDateCall = givpower.try_initialDate();
  if (!initialDateCall.reverted) {
    initialDate = initialDateCall.value.toI32();
  }
  const roundDurationCall = givpower.try_roundDuration();
  if (!initialDateCall.reverted) {
    roundDuration = roundDurationCall.value.toI32();
  }

  const txHash = event.transaction.hash.toHex();
  const rounds = event.params.rounds.toI32();
  const untilRound = event.params.untilRound.toI32();

  const powerLock = new PowerLock(txHash);
  powerLock.user = userAddress.toHex();
  powerLock.amount = powerAmount;
  powerLock.untilRound = untilRound;
  powerLock.rounds = rounds;
  powerLock.unlocked = false;
  if (initialDate && roundDuration) {
    powerLock.unlockableAt = initialDate + untilRound * roundDuration;
  }
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
