import {Client, createRestAppClient, expect} from '@loopback/testlab';
import {QuoteApiApplication} from '../..';
import {fixtures} from '../fixtures';

describe('api.zitat-service.de (end2end)', () => {
  let app: QuoteApiApplication;
  let client: Client;

  before(async () => {
    app = new QuoteApiApplication({
      rest: {
        host: '127.0.0.1', // using localhost
        port: 3010,        // using differnet port as development instance with 3000
      },
    });
    await app.boot();
    await app.start();
    client = createRestAppClient(app);
  });

  after(() => app.stop());

  it('invokes GET /locales', async () => {
    const response = await client.get('/locales').expect(200);
    expect(response.body).to.eql(["de", "en", "es", "ja", "uk"]);
  });

  it('invokes GET /users', async () => {
    const response = await client.get('/users').expect(200);
    expect(response.body).to.eql(fixtures.users);
  });
  it('invokes GET /users?page=1', async () => {
    const response = await client.get('/users?page=1').expect(200);
    expect(response.body).to.eql(fixtures.users);
  });
  it('invokes GET /users?page=2&size=10', async () => {
    const response = await client.get('/users?page=2&size=10').expect(200);
    expect(response.body).to.eql(fixtures.users.slice(10, 20));
  });
  it('invokes GET /users?starting=H', async () => {
    const response = await client.get('/users?starting=H').expect(200);
    expect(response.body).to.eql(fixtures.users.filter(user => user.login[0].toLowerCase() === 'h'));
  });
  it('invokes GET /users?starting=HE', async () => {
    const response = await client.get('/users?starting=HE').expect(200);
    expect(response.body).to.eql(fixtures.users.filter(user => user.login.substring(0, 2).toLowerCase() === 'he'));
  });
  it('invokes GET /users?starting=Heiko', async () => {
    const response = await client.get('/users?starting=Heiko').expect(200);
    expect(response.body).to.eql(fixtures.users.filter(user => user.login.toLowerCase() === 'heiko'));
  });
  it('invokes GET /users?starting=cheesecake', async () => {
    const response = await client.get('/users?starting=cheesecake').expect(200);
    expect(response.body).to.eql([]);
  });

});
