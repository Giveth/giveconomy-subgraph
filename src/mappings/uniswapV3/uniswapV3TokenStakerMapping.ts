import {
  TokenStaked,
  TokenUnstaked,
  UniswapV3Staker,
} from '../../types/UniswapV3Staker/UniswapV3Staker';
import { UniswapPosition } from '../../types/schema';
import { networkUniswapV3Config } from '../../configuration';
import { dataSource } from '@graphprotocol/graph-ts';

const network = dataSource.network();

const uniswapV3Config =
  network == 'kovan'
    ? networkUniswapV3Config.kovan
    : networkUniswapV3Config.mainnet;

const uniswapRewardTokenIncentiveId = uniswapV3Config.UNISWAP_V3_INCENTIVE_ID;

export function handleTokenStaked(event: TokenStaked): void {
  const incentiveId = event.params.incentiveId.toHex();
  if (incentiveId != uniswapRewardTokenIncentiveId) {
    return;
  }
  const contract = UniswapV3Staker.bind(event.address);
  let uniswapStakedPosition = UniswapPosition.load(
    event.params.tokenId.toString(),
  );
  if (!uniswapStakedPosition) {
    uniswapStakedPosition = new UniswapPosition(
      event.params.tokenId.toString(),
    );
  }

  const tokenId = event.params.tokenId;
  const staker = contract.deposits(tokenId).value0.toHex();
  uniswapStakedPosition.staked = true;
  uniswapStakedPosition.staker = staker;
  uniswapStakedPosition.tokenId = tokenId.toString();
  uniswapStakedPosition.save();
}

export function handleTokenUnstaked(event: TokenUnstaked): void {
  const incentiveId = event.params.incentiveId.toHex();

  if (incentiveId != uniswapRewardTokenIncentiveId) {
    return;
  }

  const uniswapStakedPosition = UniswapPosition.load(
    event.params.tokenId.toString(),
  );
  if (!uniswapStakedPosition) {
    return;
  }
  uniswapStakedPosition.staked = false;
  uniswapStakedPosition.staker = null;
  uniswapStakedPosition.save();
}
