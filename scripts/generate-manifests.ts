import * as yaml from 'js-yaml';
import * as Handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';

const generateManifests = async (): Promise<void> => {
  const networksFilePath = path.resolve(__dirname, '../networks.yaml');
  const networks = yaml.load(
    await fs.readFile(networksFilePath, { encoding: 'utf-8' }),
  ) as Record<string, Record<string, unknown>>;

  const template = fs.readFileSync('subgraph.template.yaml').toString();
  Object.entries(networks).forEach(([network, config]) => {
    fs.writeFileSync(
      `subgraph${network === 'mainnet' ? '' : `.${network}`}.yaml`,
      Handlebars.compile(template)(config),
    );
  });

  // eslint-disable-next-line no-console
  console.log('🎉 subgraph successfully generated\n');
};

generateManifests();
