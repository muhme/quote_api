import {RestServer} from '@loopback/rest';
import {validateApiSpec} from '@loopback/testlab';
import {QuoteApiApplication} from '../..';

describe('OpenAPI specification', () => {
  it('OpenAPI specification is valid', async () => {
    const app = new QuoteApiApplication();
    const server = await app.getServer(RestServer);
    const spec = await server.getApiSpec();
    await validateApiSpec(spec);
  });
});
