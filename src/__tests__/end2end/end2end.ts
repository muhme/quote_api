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


  //************
  // languages *
  //************

  it('invokes GET /languages', async () => {
    const response = await client.get('/languages').expect(200);
    expect(response.body).to.eql(["de", "en", "es", "ja", "uk"]);
  });


  //********
  // users *
  //********

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
  it('invokes GET /users?page=P', async () => {
    const response = await client.get('/users?page=P').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /users?size=', async () => {
    const response = await client.get('/users?size=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /users?size=0', async () => {
    const response = await client.get('/users?size=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /users?size=S', async () => {
    const response = await client.get('/users?size=S').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // exact 20 chars are working, but does not find any user
  it('invokes GET /users?starting=abcdefghijklmnopqrst', async () => {
    const response = await client.get('/users?starting=abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /users?starting=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/users?starting=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, only letters allowed
  it('invokes GET /users?starting=OR \'1\'=\'1', async () => {
    const response = await client.get('/users?starting=OR \'1\'=\'1').expect(400);
    response.text.should.containEql('BadRequestError');
  });


  //*************
  // categories *
  //*************

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
  it('invokes GET /categories?page=', async () => {
    const response = await client.get('/categories?page=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /categories?page=0', async () => {
    const response = await client.get('/categories?page=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /categories?page=A', async () => {
    const response = await client.get('/categories?page=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /categories?page=1000', async () => {
    const response = await client.get('/categories?page=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /categories?size=', async () => {
    const response = await client.get('/categories?size=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /categories?size=0', async () => {
    const response = await client.get('/categories?size=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /categories?size=Y', async () => {
    const response = await client.get('/categories?size=Y').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // exact 20 chars are working, but does not find any category
  it('invokes GET /categories?starting=abcdefghijklmnopqrst', async () => {
    const response = await client.get('/categories?starting=abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /categories?starting=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/categories?starting=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, only letters allowed
  it('invokes GET /categories?starting=a.b', async () => {
    const response = await client.get('/categories?starting=a.b').expect(400);
    response.text.should.containEql('BadRequestError');
  });


  //**********
  // authors *
  //**********

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
  it('invokes GET /authors?page=200&size=1', async () => {
    const response = await client.get('/authors?page=200&size=1').expect(200);
    expect({
      "language": "en",
      "totalCount": 562,
      "page": 200,
      "size": 1
    }).to.eql(response.body.paging);
    expect([{
      "id": 419,
      "lastname": "Grillparzer",
      "firstname": "Franz",
      "description": "Austrian writer (1791 - 1872)",
      "link": "https://en.wikipedia.org/wiki/Franz_Grillparzer",
      "name": "Franz Grillparzer"
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
  it('invokes GET /authors?page=', async () => {
    const response = await client.get('/authors?page=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /authors?page=0', async () => {
    const response = await client.get('/authors?page=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /authors?page=A', async () => {
    const response = await client.get('/authors?page=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /authors?page=1000', async () => {
    const response = await client.get('/authors?page=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /authors?size=', async () => {
    const response = await client.get('/authors?size=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /authors?size=0', async () => {
    const response = await client.get('/authors?size=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /authors?size=Y', async () => {
    const response = await client.get('/authors?size=Y').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /authors?lfd=X,Y,Z', async () => {
    const response = await client.get('/authors?lfd=X,Y,Z').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /authors?lastname=XXX', async () => {
    const response = await client.get('/authors?lastname=XXX').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /authors?firstname=YYY', async () => {
    const response = await client.get('/authors?firstname=YYY').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /authors?description=ZZZ', async () => {
    const response = await client.get('/authors?description=ZZZ').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // exact 20 chars are working, but does not find any user
  it('invokes GET /authors?lastname=abcdefghijklmnopqrst', async () => {
    const response = await client.get('/authors?lastname=abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /authors?lastname=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/authors?lastname=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, only letters allowed
  it('invokes GET /authors?lastname=a.b', async () => {
    const response = await client.get('/authors?lastname=a.b').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // exact 20 chars are working, but does not find any user
  it('invokes GET /authors?firstname=abcdefghijklmnopqrst', async () => {
    const response = await client.get('/authors?firstname=abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /authors?firstname=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/authors?firstname=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, only letters allowed
  it('invokes GET /authors?firstname=a.b', async () => {
    const response = await client.get('/authors?firstname=a.b').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // exact 20 chars are working, but does not find any user
  it('invokes GET /authors?description=abcdefghijklmnopqrst', async () => {
    const response = await client.get('/authors?description=abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /authors?description=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/authors?description=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, only letters allowed
  it('invokes GET /authors?description=a.b', async () => {
    const response = await client.get('/authors?description=a.b').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // exact 20 chars are working, but does not find any user
  it('invokes GET /authors?lfd=abcdefghijklmnopqrst,abcdefghijklmnopqrst,abcdefghijklmnopqrst', async () => {
    const response = await client.get('/authors?lfd=abcdefghijklmnopqrst,abcdefghijklmnopqrst,abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /authors?lfd=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/authors?lfd=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, only letters allowed
  it('invokes GET /authors?lfd=a.b', async () => {
    const response = await client.get('/authors?lfd=a.b').expect(400);
    response.text.should.containEql('BadRequestError');
  });

  // **********
  // * author *
  // **********
  it('invokes GET /author?id=597&language=ja', async () => {
    const response = await client.get('/author?id=597&language=ja').expect(200);
    expect({
      author: {
        id: 597,
        lastname: "坂本",
        firstname: "龍一",
        description: "日本の作曲家、ピアニスト、プロデューサー、俳優、モデル（1952年～2023年）",
        link: "https://ja.wikipedia.org/wiki/坂本龍一",
        name: "坂本・龍一"
      }
    }).to.eql(response.body);
  });
  // missing language defaults to :en
  it('invokes GET /author?id=597', async () => {
    const response = await client.get('/author?id=597').expect(200);
    expect({
      author: {
        id: 597,
        lastname: "Sakamoto",
        firstname: "Ryuichi",
        description: "Japanese composer, pianist, producer, actor and model (1952 - 2023)",
        link: "https://en.wikipedia.org/wiki/Ryuichi_Sakamoto",
        name: "Ryuichi Sakamoto"
      }
    }).to.eql(response.body);
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
  it('invokes GET /author?id=', async () => {
    const response = await client.get('/author?id=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /author?id=A', async () => {
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

  //********
  // quote *
  //********

  it('invokes GET /quote', async () => {
    const response = await client.get('/quote').expect(200);
    expect(response.body).to.have.property('quote');
    expect(response.body).to.have.property('link');
  });
  // explicit testing authorID 0 (unknown)
  it('invokes GET /quote?authorId=0', async () => {
    const response = await client.get('/quote?authorId=0').expect(200);
    expect(response.body).to.have.property('quote');
    expect(response.body).to.have.property('link');
    expect(response.body).to.have.property('authorId', 0);
    expect(response.body).to.have.property('authorName');
  });
  // following tests are figured out with exactly one quote returned
  it('invokes GET /quote?authorId=601', async () => {
    const response = await client.get('/quote?authorId=601').expect(200);
    expect({
      quote: "Dance is the hidden language of the soul.",
      language: "en",
      link: "https://www.zitat-service.de/en/quotations/1906",
      source: "Martha Graham Reflects on Her Art and a Life in Dance, The New York Times, 1985",
      sourceLink: "https://archive.nytimes.com/www.nytimes.com/library/arts/033185graham.html",
      authorId: 601,
      authorName: "Martha Graham",
      authorLink: "https://en.wikipedia.org/wiki/Martha_Graham"
    }).to.eql(response.body);
  });
  it('invokes GET /quote?userId=97&language=de', async () => {
    const response = await client.get('/quote?userId=97&language=de').expect(200);
    expect({
      quote: "Missverständnis? Die häufigste Form menschlicher Kommunikation.",
      language: "de",
      link: "https://www.zitat-service.de/de/quotations/1527",
      authorId: 439,
      authorName: "Peter Benary",
      authorLink: "https://de.wikipedia.org/wiki/Peter_Benary"
    }).to.eql(response.body);
  });
  it('invokes GET /quote?authorId=0&categoryId=16&userId=73&language=es', async () => {
    const response = await client.get('/quote?authorId=0&categoryId=16&userId=73&language=es').expect(200);
    expect({
      quote: "Vivir con miedo, es como vivir a medias.",
      language: "es",
      link: "https://www.zitat-service.de/es/quotations/1903",
      authorId: 0,
      authorName: "Desconocido"
    }).to.eql(response.body);
  });
  it('invokes GET /quote?authorId=33&categoryId=501&language=de', async () => {
    const response = await client.get('/quote?authorId=33&categoryId=501&language=de').expect(200);
    expect({
      quote: "Was nicht umstritten ist, ist auch nicht sonderlich interessant.",
      language: "de",
      link: "https://www.zitat-service.de/de/quotations/1687",
      authorId: 33,
      authorName: "Johann Wolfgang von Goethe",
      authorLink: "https://de.wikipedia.org/wiki/Johann_Wolfgang_von_Goethe"
    }).to.eql(response.body);
  });

  // incorrect parameters
  it('invokes GET /quote?userId=', async () => {
    const response = await client.get('/quote?userId=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /quote?userId=-1', async () => {
    const response = await client.get('/quote?userId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /quote?userId=A', async () => {
    const response = await client.get('/quote?userId=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /quote?userId=1000', async () => {
    const response = await client.get('/quote?userId=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /quote?authorId=', async () => {
    const response = await client.get('/quote?authorId=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /quote?authorId=-1', async () => {
    const response = await client.get('/quote?authorId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /quote?authorId=A', async () => {
    const response = await client.get('/quote?authorId=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /quote?authorId=1000', async () => {
    const response = await client.get('/quote?authorId=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /quote?categoryId=', async () => {
    const response = await client.get('/quote?categoryId=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /quote?categoryId=-1', async () => {
    const response = await client.get('/quote?categoryId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /quote?categoryId=A', async () => {
    const response = await client.get('/quote?categoryId=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /quote?categoryId=1000', async () => {
    const response = await client.get('/quote?categoryId=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /quote?language=', async () => {
    const response = await client.get('/quote?language=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /quote?language=XXX', async () => {
    const response = await client.get('/quote?language=XXX').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // testing #1919 non-public quote with non-public category #623
  it('invokes GET /quote?categoryId=623', async () => {
    const response = await client.get('/quote?categoryId=623').expect(404);
    response.text.should.containEql('NotFoundError');
  });
});
