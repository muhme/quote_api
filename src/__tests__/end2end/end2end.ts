import {Client, createRestAppClient, expect} from '@loopback/testlab';
import 'should';
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

  // correct requests
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
  // special w/o starting is like all
  it('invokes GET /users?starting=', async () => {
    const response = await client.get('/users?starting=').expect(200);
    expect(response.body).to.eql(fixtures.users);
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
  // incorrect requests
  it('invokes GET /users?page=', async () => {
    const response = await client.get('/users?page=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /users?size=', async () => {
    const response = await client.get('/users?page=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection
  it('invokes GET /users?starting=OR \'1\'=\'1', async () => {
    const response = await client.get('/users?starting=OR \'1\'=\'1').expect(200);
    expect(response.body).to.eql([]);
  });

  // correct requests
  it('invokes GET /categories', async () => {
    const response = await client.get('/categories').expect(200);
    expect(response.body.length).to.equal(100);
  });
  it('invokes GET /categories?size=1000', async () => {
    const response = await client.get('/categories?size=1000').expect(200);
    expect(response.body.length).to.equal(570);
  });
  it('invokes GET /categories?locale=de&page=100&size=1', async () => {
    const response = await client.get('/categories?locale=de&page=100&size=1').expect(200);
    expect(response.body).to.eql([{
      "id": 276,
      "value": "Ende"
    }]);
  });
  it('invokes GET /categories?locale=es&page=120&size=1', async () => {
    const response = await client.get('/categories?locale=es&page=120&size=1').expect(200);
    expect(response.body).to.eql([{
      "id": 293,
      "value": "Corto"
    }]);
  });
  it('invokes GET /categories?locale=ja&page=140&size=1', async () => {
    const response = await client.get('/categories?locale=ja&page=140&size=1').expect(200);
    expect(response.body).to.eql([{
      "id": 213,
      "value": "セルフ"
    }]);
  });
  it('invokes GET /categories?locale=uk&page=160&size=1', async () => {
    const response = await client.get('/categories?locale=uk&page=160&size=1').expect(200);
    expect(response.body).to.eql([{
      "id": 517,
      "value": "Жити разом"
    }]);
  });
  it('invokes GET /categories?starting=Ban', async () => {
    const response = await client.get('/categories?starting=Ban').expect(200);
    expect(response.body).to.eql([{
      "id": 557,
      "value": "Bank"
    }]);
  });
  // German Umlaut
  it('invokes GET /categories?locale=de&starting=Fah', async () => {
    const response = await client.get('/categories?locale=de&starting=Fah').expect(200);
    expect(response.body).to.eql([{
      "id": 410,
      "value": "Fähigkeit"
    }]);
  });
  it('invokes GET /categories?locale=de&starting=Fäh', async () => {
    const response = await client.get('/categories?locale=de&starting=' + encodeURIComponent('Fäh')).expect(200);
    expect(response.body).to.eql([{
      "id": 410,
      "value": "Fähigkeit"
    }]);
  });
  // Espanol acute accent
  it('invokes GET /categories?locale=es&starting=Áci', async () => {
    const response = await client.get('/categories?locale=es&starting=' + encodeURIComponent('Áci')).expect(200);
    expect(response.body).to.eql([{
      "id": 428,
      "value": "Ácido"
    }]);
  });
  it('invokes GET /categories?locale=es&starting=Aci', async () => {
    const response = await client.get('/categories?locale=es&starting=Aci').expect(200);
    expect(response.body).to.eql([{
      "id": 428,
      "value": "Ácido"
    }]);
  });
  // Japanese hiragana
  it('invokes GET /categories?locale=ja&starting=おそ', async () => {
    const response = await client.get('/categories?locale=ja&starting=' + encodeURIComponent('おそ')).expect(200);
    expect(response.body).to.eql([{
      "id": 457,
      "value": "おそらく"
    }]);
  });
  // Japanese katakana
  it('invokes GET /categories?locale=ja&starting=アイブ', async () => {
    const response = await client.get('/categories?locale=ja&starting=' + encodeURIComponent('アイブ')).expect(200);
    expect(response.body).to.eql([{
      "id": 222,
      "value": "アイブロウ"
    }]);
  });
  // Ukrainian cyrillic
  it('invokes GET /categories?locale=uk&starting=Іді', async () => {
    const response = await client.get('/categories?locale=uk&starting=' + encodeURIComponent('Іді')).expect(200);
    expect(response.body).to.eql([{
      "id": 273,
      "value": "Ідіот"
    }]);
  });
  // if not URL encoded it is not found and return 200 with empty array
  // working, but not testable with Node.js HTTP client
  // fails with: TypeError: Request path contains unescaped characters

  // it('invokes GET /categories?locale=uk&starting=Іді', async () => {
  //   const response = await client.get('/categories?locale=uk&starting=Іді').expect(200);
  //   expect(response.body).to.eql([]);
  // });


  // incorrect locale defaults to english
  it('invokes GET /categories?locale=en&page=160&size=1', async () => {
    const response = await client.get('/categories?locale=en&page=160&size=1').expect(200);
    expect(response.body).to.eql([{
      "id": 483,
      "value": "Europe"
    }]);
  });
  it('invokes GET /categories?locale=&page=160&size=1', async () => {
    const response = await client.get('/categories?locale=&page=160&size=1').expect(200);
    expect(response.body).to.eql([{
      "id": 483,
      "value": "Europe"
    }]);
  });
  it('invokes GET /categories?locale=XXX&page=160&size=1', async () => {
    const response = await client.get('/categories?locale=XXX&page=160&size=1').expect(200);
    expect(response.body).to.eql([{
      "id": 483,
      "value": "Europe"
    }]);
  });
});
