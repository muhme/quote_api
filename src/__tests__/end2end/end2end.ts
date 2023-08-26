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


  // ************
  // * platform *
  // ************

  it('invokes GET /explorer/', async () => {
    const response = await client.get('/explorer/').expect(200);
    response.text.should.containEql('<title>LoopBack API Explorer</title>');
  });
  it('invokes GET /openapi.json', async () => {
    const response = await client.get('/openapi.json').expect(200);
    response.text.should.containEql('openapi');
  });
  // incorrect requests
  it('invokes GET /Cheshire/Cat', async () => {
    const response = await client.get('/Cheshire/Cat').expect(404);
    response.text.should.containEql('NotFoundError');
  });


  // *************
  // * languages *
  // *************

  it('invokes GET /languages', async () => {
    const response = await client.get('/languages').expect(200);
    expect(response.body).to.eql(["de", "en", "es", "ja", "uk"]);
  });


  // *********
  // * users *
  // *********

  // correct requests
  it('invokes GET /users', async () => {
    const response = await client.get('/users').expect(200);
    expect(fixtures.usersPaged).to.eql(response.body);
  });
  it('invokes GET /users?page=1', async () => {
    const response = await client.get('/users?page=1').expect(200);
    expect(fixtures.usersPaged).to.eql(response.body);
  });
  it('invokes GET /users?page=2&size=10', async () => {
    const response = await client.get('/users?page=2&size=10').expect(200);
    expect({
      paging: {totalCount: 60, page: 2, size: 10},
      users: fixtures.users.slice(10, 20)
    }).to.eql(response.body);
  });
  // special w/o starting is like all
  it('invokes GET /users?starting=', async () => {
    const response = await client.get('/users?starting=').expect(200);
    expect(fixtures.usersPaged).to.eql(response.body);
  });
  it('invokes GET /users?starting=H', async () => {
    const response = await client.get('/users?starting=H').expect(200);
    expect({
      paging: {totalCount: 5, page: 1, size: 100, starting: "H"},
      users: fixtures.users.filter(user => user.login[0].toLowerCase() === 'h')
    }).to.eql(response.body);
  });
  it('invokes GET /users?starting=HE', async () => {
    const response = await client.get('/users?starting=HE').expect(200);
    expect({
      paging: {totalCount: 3, page: 1, size: 100, starting: "HE"},
      users: fixtures.users.filter(user => user.login.substring(0, 2).toLowerCase() === 'he')
    }).to.eql(response.body);
  });
  it('invokes GET /users?starting=Heiko', async () => {
    const response = await client.get('/users?starting=Heiko').expect(200);
    expect({
      paging: {totalCount: 1, page: 1, size: 100, starting: "Heiko"},
      users: fixtures.users.filter(user => user.login.toLowerCase() === 'heiko')
    }).to.eql(response.body);
  });
  it('invokes GET /users?starting=cheesecake', async () => {
    const response = await client.get('/users?starting=cheesecake').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // incorrect requests
  it('invokes GET /users?page=', async () => {
    const response = await client.get('/users?page=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /users?page=0', async () => {
    const response = await client.get('/users?page=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /users?page=1000', async () => {
    const response = await client.get('/users?page=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /users?size=', async () => {
    const response = await client.get('/users?size=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /users?size=0', async () => {
    const response = await client.get('/users?size=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection
  it('invokes GET /users?starting=OR \'1\'=\'1', async () => {
    const response = await client.get('/users?starting=OR \'1\'=\'1').expect(404);
    response.text.should.containEql('NotFoundError');
  });


  // **************
  // * categories *
  // **************

  // correct requests
  it('invokes GET /categories', async () => {
    const response = await client.get('/categories').expect(200);
    expect(100).to.equal(response.body.categories.length);
  });
  // this tests also that non-public categories are not given,
  // as the SQL dump contains 571 categories, including category #623 "Non-Public Category"
  it('invokes GET /categories?size=1000', async () => {
    const response = await client.get('/categories?size=1000').expect(200);
    expect(570).to.equal(response.body.categories.length);
  });
  it('invokes GET /categories?language=de&page=100&size=1', async () => {
    const response = await client.get('/categories?language=de&page=100&size=1').expect(200);
    expect([{
      "id": 276,
      "category": "Ende"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /categories?language=es&page=120&size=1', async () => {
    const response = await client.get('/categories?language=es&page=120&size=1').expect(200);
    expect([{
      "id": 293,
      "category": "Corto"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /categories?language=ja&page=140&size=1', async () => {
    const response = await client.get('/categories?language=ja&page=140&size=1').expect(200);
    expect([{
      "id": 213,
      "category": "セルフ"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /categories?language=uk&page=160&size=1', async () => {
    const response = await client.get('/categories?language=uk&page=160&size=1').expect(200);
    expect([{
      "id": 517,
      "category": "Жити разом"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /categories?starting=Ban', async () => {
    const response = await client.get('/categories?starting=Ban').expect(200);
    expect([{
      "id": 557,
      "category": "Bank"
    }]).to.eql(response.body.categories);
  });
  // German Umlaut
  it('invokes GET /categories?language=de&starting=Fah', async () => {
    const response = await client.get('/categories?language=de&starting=Fah').expect(200);
    expect([{
      "id": 410,
      "category": "Fähigkeit"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /categories?language=de&starting=Fäh', async () => {
    const response = await client.get('/categories?language=de&starting=' + encodeURIComponent('Fäh')).expect(200);
    expect([{
      "id": 410,
      "category": "Fähigkeit"
    }]).to.eql(response.body.categories);
  });
  // Espanol acute accent
  it('invokes GET /categories?language=es&starting=Áci', async () => {
    const response = await client.get('/categories?language=es&starting=' + encodeURIComponent('Áci')).expect(200);
    expect([{
      "id": 428,
      "category": "Ácido"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /categories?language=es&starting=Aci', async () => {
    const response = await client.get('/categories?language=es&starting=Aci').expect(200);
    expect([{
      "id": 428,
      "category": "Ácido"
    }]).to.eql(response.body.categories);
  });
  // Japanese hiragana
  it('invokes GET /categories?language=ja&starting=おそ', async () => {
    const response = await client.get('/categories?language=ja&starting=' + encodeURIComponent('おそ')).expect(200);
    expect([{
      "id": 457,
      "category": "おそらく"
    }]).to.eql(response.body.categories);
  });
  // Japanese katakana
  it('invokes GET /categories?language=ja&starting=アイブ', async () => {
    const response = await client.get('/categories?language=ja&starting=' + encodeURIComponent('アイブ')).expect(200);
    expect([{
      "id": 222,
      "category": "アイブロウ"
    }]).to.eql(response.body.categories);
  });
  // Ukrainian cyrillic
  it('invokes GET /categories?language=uk&starting=Іді', async () => {
    const response = await client.get('/categories?language=uk&starting=' + encodeURIComponent('Іді')).expect(200);
    expect([{
      "id": 273,
      "category": "Ідіот"
    }]).to.eql(response.body.categories);
  });
  // if not URL encoded it is not found and return 200 with empty array
  // working, but not testable with Node.js HTTP client
  // fails with: TypeError: Request path contains unescaped characters

  // it('invokes GET /categories?language=uk&starting=Іді', async () => {
  //   const response = await client.get('/categories?language=uk&starting=Іді').expect(200);
  //   expect(response.body).to.eql([]);
  // });

  // not set language defaults to english
  it('invokes GET /categories?page=160&size=1', async () => {
    const response = await client.get('/categories?page=160&size=1').expect(200);
    expect([{
      "id": 483,
      "category": "Europe"
    }]).to.eql(response.body.categories);
  });

  // incorrect parameters
  it('invokes GET /categories?language=&page=160&size=1', async () => {
    const response = await client.get('/categories?language=&page=160&size=1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /categories?language=XXX&page=160&size=1', async () => {
    const response = await client.get('/categories?language=XXX&page=160&size=1').expect(400);
    response.text.should.containEql('BadRequestError');
  });


  // ***********
  // * authors *
  // ***********

  // correct requests
  it('invokes GET /authors', async () => {
    const response = await client.get('/authors').expect(200);
    expect(100).to.equal(response.body.authors.length);
  });
  // this tests also that non-public authors are not given,
  // as the SQL dump contains 563 authors, including tha author entry #603 "Non-Public Author Entry"
  it('invokes GET /authors?size=1000', async () => {
    const response = await client.get('/authors?size=1000').expect(200);
    expect(562).to.equal(response.body.authors.length);
  });
  it('invokes GET /authors?language=de&page=100&size=1', async () => {
    const response = await client.get('/authors?language=de&page=100&size=1').expect(200);
    expect([{
      "id": 331,
      "lastname": "Chanel",
      "firstname": "Coco",
      "description": "Französische Modeschöpferin (1883 – 1971)",
      "link": "https://de.wikipedia.org/wiki/Coco_Chanel",
      "name": "Coco Chanel"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /authors?language=es&page=120&size=1', async () => {
    const response = await client.get('/authors?language=es&page=120&size=1').expect(200);
    expect([{
      "id": 451,
      "lastname": "Cramer",
      "firstname": "Dettmar",
      "description": "Futbolista y entrenador alemán (n. 1925)",
      "link": "https://es.wikipedia.org/wiki/Dettmar_Cramer",
      "name": "Dettmar Cramer"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /authors?language=ja&page=140&size=1', async () => {
    const response = await client.get('/authors?language=ja&page=140&size=1').expect(200);
    expect([{
      "id": 425,
      "lastname": "グロッサー",
      "firstname": "ピーター",
      "description": "ドイツのサッカー選手、監督（*1938年）",
      "name": "グロッサー・ピーター"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /authors?language=uk&page=160&size=1', async () => {
    const response = await client.get('/authors?language=uk&page=160&size=1').expect(200);
    expect([{
      "id": 599,
      "lastname": "Григорович",
      "firstname": "Шевченко Тарас",
      "description": "Український поет і художник (1814 - 1861)",
      "link": "https://uk.wikipedia.org/wiki/Шевченко_Тарас_Григорович",
      "name": "Шевченко Тарас Григорович"
    }]).to.eql(response.body.authors);
  });
  // missing language defaults to :en
  it('invokes GET /authors?page=20&size=1', async () => {
    const response = await client.get('/authors?page=20&size=1').expect(200);
    expect({
      "language": "en",
      "totalCount": 562,
      "page": 20,
      "size": 1
    }).to.eql(response.body.paging);
    expect([{
      "id": 92,
      "lastname": "Adams",
      "firstname": "Henry",
      "description": "US-American historian and cultural philosopher (1838 - 1918)",
      "link": "https://en.wikipedia.org/wiki/Henry_Adams",
      "name": "Henry Adams"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /authors?lastname=A&firstname=D&size=1', async () => {
    const response = await client.get('/authors?lastname=A&firstname=D&size=1').expect(200);
    expect([{
      "id": 345,
      "lastname": "Adams",
      "firstname": "Douglas",
      "description": "British writer (1952 - 2001)",
      "link": "https://en.wikipedia.org/wiki/Douglas_Adams",
      "name": "Douglas Adams"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /authors?description=British%20actress', async () => {
    const response = await client.get('/authors?description=British%20actress').expect(200);
    expect([{
      "id": 339,
      "lastname": "Andrews",
      "firstname": "Julie",
      "description": "British actress, singer and writer (born 1935)",
      "link": "https://en.wikipedia.org/wiki/Julie_Andrews",
      "name": "Julie Andrews"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /authors?lfd=Adams,H', async () => {
    const response = await client.get('/authors?lfd=Adams,H').expect(200);
    expect([{
      "id": 92,
      "lastname": "Adams",
      "firstname": "Henry",
      "description": "US-American historian and cultural philosopher (1838 - 1918)",
      "link": "https://en.wikipedia.org/wiki/Henry_Adams",
      "name": "Henry Adams"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /authors?lfd=,Karen', async () => {
    const response = await client.get('/authors?lfd=,Karen').expect(200);
    expect([{
      "id": 18,
      "firstname": "Karen, 7 years",
      "description": "asked: What does love mean?",
      "name": "Karen, 7 years"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /authors?language=de&lfd=Adenauer,Konrad,Deutscher%20Politiker', async () => {
    const response = await client.get('/authors?language=de&lfd=Adenauer,Konrad,Deutscher%20Politiker').expect(200);
    expect([{
      "id": 243,
      "lastname": "Adenauer",
      "firstname": "Konrad",
      "description": "Deutscher Politiker und Bundeskanzler (1876 – 1967)",
      "link": "https://de.wikipedia.org/wiki/Konrad_Adenauer",
      "name": "Konrad Adenauer"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /authors?lfd=&size=1000', async () => {
    const response = await client.get('/authors?lfd=&size=1000').expect(200);
    expect(response.body.authors.length).to.equal(562);
  });

  // incorrect parameters
  it('invokes GET /authors?language=', async () => {
    const response = await client.get('/authors?language=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /authors?language=XXX', async () => {
    const response = await client.get('/authors?language=XXX').expect(400);
    response.text.should.containEql('BadRequestError');
  });

  // **********
  // * author *
  // **********
  it('invokes GET /author?id=597&language=ja', async () => {
    const response = await client.get('/author?id=597&language=ja').expect(200);
    expect([{
      "id": 597,
      "lastname": "坂本",
      "firstname": "龍一",
      "description": "日本の作曲家、ピアニスト、プロデューサー、俳優、モデル（1952年～2023年）",
      "link": "https://ja.wikipedia.org/wiki/坂本龍一",
      "name": "坂本・龍一"
    }]).to.eql(response.body);
  });
  // missing language defaults to :en
  it('invokes GET /author?id=597', async () => {
    const response = await client.get('/author?id=597').expect(200);
    expect([{
      "id": 597,
      "lastname": "Sakamoto",
      "firstname": "Ryuichi",
      "description": "Japanese composer, pianist, producer, actor and model (1952 - 2023)",
      "link": "https://en.wikipedia.org/wiki/Ryuichi_Sakamoto",
      "name": "Ryuichi Sakamoto"
    }]).to.eql(response.body);
  });

  // incorrect parameters
  it('invokes GET /author?id=1000', async () => {
    const response = await client.get('/author?id=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /author?id=-1', async () => {
    const response = await client.get('/author?id=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /author?id=597&language=', async () => {
    const response = await client.get('/author?id=597&language=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /author?id=597&language=XXX', async () => {
    const response = await client.get('/author?id=597&language=XXX').expect(400);
    response.text.should.containEql('BadRequestError');
  });


  // this tests also that non-public quotations are not given,
  // as the SQL dump contains 1'443 quotations, including #1919 "Non-Public Quote"

  // incorrect parameters
  it('invokes GET /quote?language=', async () => {
    const response = await client.get('/quote?language=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /quote?language=XXX', async () => {
    const response = await client.get('/quote?language=XXX').expect(400);
    response.text.should.containEql('BadRequestError');
  });
});
