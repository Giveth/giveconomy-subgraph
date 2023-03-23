import { Transfer } from '../types/GiversPFP/GiversPFP';
import { getGiversPFPTokenId, getUserEntity } from '../utils/misc';
import { Address, log, dataSource } from '@graphprotocol/graph-ts';
import { GiversPFPToken } from '../types/schema';

const network = dataSource.network();
const imageIpfsBaseHash =
  network == 'goerli'
    ? 'ipfs://Qmcee5jErZSmLxxEE1K3HAKfyAhDAtu361tJqxLrMU7uW3/'
    : 'ipfs://QmRn7wJhf2LkCCY8EsBkzFQZpPqMRi13y6QVGQJodeJxnE/';

export function handleTransfer(event: Transfer): void {
  const from = event.params.from;
  const to = event.params.to;
  const id = event.params.tokenId.toI32();

  const tokenId = getGiversPFPTokenId(event.address, id);
  let token = GiversPFPToken.load(tokenId);

  if (from.toHex() != Address.zero().toHex()) {
    if (token == null) {
      log.error(
        'transfer GiversPFP {} from non zero address {} but the source does not exists!',
        [id.toString(10), from.toHex()],
      );
    }
  }

  if (token == null) {
    token = new GiversPFPToken(tokenId);
    token.tokenId = id;
    token.contractAddress = event.address.toHex();
    token.imageIpfs = imageIpfsBaseHash + id.toString() + '.png';
  }
  getUserEntity(to);
  token.user = to.toHex();
  token.save();
}
