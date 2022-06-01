import yaml = require('js-yaml');

import Handlebars = require('handlebars');
import fs = require('fs-extra');
import path = require('path');

Handlebars.registerHelper('lowercase', function (str) {
  if (str && typeof str === 'string') {
    return str.toLowerCase();
  }
  return '';
});

function getNetworkNameForSubgraph(): string | null {
  switch (process.env.SUBGRAPH) {
    case 'ORGANISATION/SUBGRAPH':
      return 'mainnet';
    case 'ORGANISATION/SUBGRAPH-GOERLI':
      return 'goerli';
    default:
      return null;
  }
}

(async (): Promise<void> => {
  if (fs.existsSync('subgraph.yaml')) fs.rmSync(`subgraph.yaml`);

  const networksFilePath = path.join(__dirname, 'networks.yaml');
  const networks = yaml.load(
    await fs.readFile(networksFilePath, { encoding: 'utf-8' }),
  );

  const networkName = process.env.NETWORK_NAME || getNetworkNameForSubgraph();
  const network = { ...networks[networkName || ''], networkName };

  if (!networkName) {
    process.exitCode = 1;
    throw new Error(
      'Please set either a "NETWORK_NAME" or a "SUBGRAPH" environment variable',
    );
  }

  const templateFiles: [string, string][] = [['subgraph', 'yaml']];
  templateFiles.forEach((templateFile) => {
    const template = fs
      .readFileSync(`${templateFile[0]}.template.${templateFile[1]}`)
      .toString();
    fs.writeFileSync(
      `${templateFile[0]}.${templateFile[1]}`,
      Handlebars.compile(template)(network),
    );
  });

  console.log('🎉 subgraph successfully generated\n');
})();
