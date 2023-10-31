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

  it('invokes GET /v1/explorer/', async () => {
    const response = await client.get('/v1/explorer/').expect(200);
    response.text.should.containEql('<title>LoopBack API Explorer</title>');
  });
  // in reality this is /v1/openapi.json
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

  it('invokes GET /v1/languages', async () => {
    const response = await client.get('/v1/languages').expect(200);
    expect(response.body).to.eql(["de", "en", "es", "ja", "uk"]);
  });


  //********
  // users *
  //********

  // correct requests
  it('invokes GET /v1/users', async () => {
    const response = await client.get('/v1/users').expect(200);
    expect(fixtures.usersPaged).to.eql(response.body);
  });
  it('invokes GET /v1/users?page=1', async () => {
    const response = await client.get('/v1/users?page=1').expect(200);
    expect(fixtures.usersPaged).to.eql(response.body);
  });
  it('invokes GET /v1/users?page=2&size=10', async () => {
    const response = await client.get('/v1/users?page=2&size=10').expect(200);
    expect({
      paging: {totalCount: 60, page: 2, size: 10},
      users: fixtures.users.slice(10, 20)
    }).to.eql(response.body);
  });
  // special w/o starting is like all
  it('invokes GET /v1/users?starting=', async () => {
    const response = await client.get('/v1/users?starting=').expect(200);
    expect(fixtures.usersPaged).to.eql(response.body);
  });
  it('invokes GET /v1/users?starting=H', async () => {
    const response = await client.get('/v1/users?starting=H').expect(200);
    expect({
      paging: {totalCount: 5, page: 1, size: 100, starting: "H"},
      users: fixtures.users.filter(user => user.login[0].toLowerCase() === 'h')
    }).to.eql(response.body);
  });
  it('invokes GET /v1/users?starting=HE', async () => {
    const response = await client.get('/v1/users?starting=HE').expect(200);
    expect({
      paging: {totalCount: 3, page: 1, size: 100, starting: "HE"},
      users: fixtures.users.filter(user => user.login.substring(0, 2).toLowerCase() === 'he')
    }).to.eql(response.body);
  });
  it('invokes GET /v1/users?starting=Heiko', async () => {
    const response = await client.get('/v1/users?starting=Heiko').expect(200);
    expect({
      paging: {totalCount: 1, page: 1, size: 100, starting: "Heiko"},
      users: fixtures.users.filter(user => user.login.toLowerCase() === 'heiko')
    }).to.eql(response.body);
  });
  it('invokes GET /v1/users?starting=cheesecake', async () => {
    const response = await client.get('/v1/users?starting=cheesecake').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // incorrect requests
  it('invokes GET /v1/users?page=', async () => {
    const response = await client.get('/v1/users?page=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/users?page=0', async () => {
    const response = await client.get('/v1/users?page=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/users?page=1.1', async () => {
    const response = await client.get('/v1/users?page=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/users?page=1000', async () => {
    const response = await client.get('/v1/users?page=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/users?page=P', async () => {
    const response = await client.get('/v1/users?page=P').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/users?size=', async () => {
    const response = await client.get('/v1/users?size=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/users?size=0', async () => {
    const response = await client.get('/v1/users?size=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/users?size=1.1', async () => {
    const response = await client.get('/v1/users?size=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/users?size=S', async () => {
    const response = await client.get('/v1/users?size=S').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // exact 20 chars are working, but does not find any user
  it('invokes GET /v1/users?starting=abcdefghijklmnopqrst', async () => {
    const response = await client.get('/v1/users?starting=abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /v1/users?starting=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/v1/users?starting=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, not starting with an apostrophe
  it('invokes GET /v1/users?starting=   \' OR \'1\'=\'1', async () => {
    const response = await client.get('/v1/users?starting=   \' OR \'1\'=\'1').expect(400);
    response.text.should.containEql('BadRequestError');
  });


  //*************
  // categories *
  //*************

  // correct requests
  it('invokes GET /v1/categories', async () => {
    const response = await client.get('/v1/categories').expect(200);
    expect(100).to.equal(response.body.categories.length);
  });
  // this tests also that non-public categories are not given,
  // as the SQL dump contains 571 categories, including category #623 "Non-Public Category"
  it('invokes GET /v1/categories?size=1000', async () => {
    const response = await client.get('/v1/categories?size=1000').expect(200);
    expect(570).to.equal(response.body.categories.length);
  });
  it('invokes GET /v1/categories?language=de&page=100&size=1', async () => {
    const response = await client.get('/v1/categories?language=de&page=100&size=1').expect(200);
    expect([{
      "id": 276,
      "category": "Ende"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /v1/categories?language=es&page=120&size=1', async () => {
    const response = await client.get('/v1/categories?language=es&page=120&size=1').expect(200);
    expect([{
      "id": 293,
      "category": "Corto"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /v1/categories?language=ja&page=140&size=1', async () => {
    const response = await client.get('/v1/categories?language=ja&page=140&size=1').expect(200);
    expect([{
      "id": 213,
      "category": "セルフ"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /v1/categories?language=uk&page=160&size=1', async () => {
    const response = await client.get('/v1/categories?language=uk&page=160&size=1').expect(200);
    expect([{
      "id": 517,
      "category": "Жити разом"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /v1/categories?starting=Ban', async () => {
    const response = await client.get('/v1/categories?starting=Ban').expect(200);
    expect([{
      "id": 557,
      "category": "Bank"
    }]).to.eql(response.body.categories);
  });
  // German Umlaut
  it('invokes GET /v1/categories?language=de&starting=Fah', async () => {
    const response = await client.get('/v1/categories?language=de&starting=Fah').expect(200);
    expect([{
      "id": 410,
      "category": "Fähigkeit"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /v1/categories?language=de&starting=Fäh', async () => {
    const response = await client.get('/v1/categories?language=de&starting=' + encodeURIComponent('Fäh')).expect(200);
    expect([{
      "id": 410,
      "category": "Fähigkeit"
    }]).to.eql(response.body.categories);
  });
  // Espanol acute accent
  it('invokes GET /v1/categories?language=es&starting=Áci', async () => {
    const response = await client.get('/v1/categories?language=es&starting=' + encodeURIComponent('Áci')).expect(200);
    expect([{
      "id": 428,
      "category": "Ácido"
    }]).to.eql(response.body.categories);
  });
  it('invokes GET /v1/categories?language=es&starting=Aci', async () => {
    const response = await client.get('/v1/categories?language=es&starting=Aci').expect(200);
    expect([{
      "id": 428,
      "category": "Ácido"
    }]).to.eql(response.body.categories);
  });
  // Japanese hiragana
  it('invokes GET /v1/categories?language=ja&starting=おそ', async () => {
    const response = await client.get('/v1/categories?language=ja&starting=' + encodeURIComponent('おそ')).expect(200);
    expect([{
      "id": 457,
      "category": "おそらく"
    }]).to.eql(response.body.categories);
  });
  // Japanese katakana
  it('invokes GET /v1/categories?language=ja&starting=アイブ', async () => {
    const response = await client.get('/v1/categories?language=ja&starting=' + encodeURIComponent('アイブ')).expect(200);
    expect([{
      "id": 222,
      "category": "アイブロウ"
    }]).to.eql(response.body.categories);
  });
  // Ukrainian cyrillic
  it('invokes GET /v1/categories?language=uk&starting=Іді', async () => {
    const response = await client.get('/v1/categories?language=uk&starting=' + encodeURIComponent('Іді')).expect(200);
    expect([{
      "id": 273,
      "category": "Ідіот"
    }]).to.eql(response.body.categories);
  });
  // if not URL encoded it is not found and return 200 with empty array
  // working, but not testable with Node.js HTTP client
  // fails with: TypeError: Request path contains unescaped characters

  // it('invokes GET /v1/categories?language=uk&starting=Іді', async () => {
  //   const response = await client.get('/v1/categories?language=uk&starting=Іді').expect(200);
  //   expect(response.body).to.eql([]);
  // });

  // not set language defaults to english
  it('invokes GET /v1/categories?page=160&size=1', async () => {
    const response = await client.get('/v1/categories?page=160&size=1').expect(200);
    expect([{
      "id": 483,
      "category": "Europe"
    }]).to.eql(response.body.categories);
  });

  // incorrect parameters
  it('invokes GET /v1/categories?language=&page=160&size=1', async () => {
    const response = await client.get('/v1/categories?language=&page=160&size=1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/categories?language=XXX&page=160&size=1', async () => {
    const response = await client.get('/v1/categories?language=XXX&page=160&size=1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/categories?page=', async () => {
    const response = await client.get('/v1/categories?page=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/categories?page=0', async () => {
    const response = await client.get('/v1/categories?page=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/categories?page=1.1', async () => {
    const response = await client.get('/v1/categories?page=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/categories?page=A', async () => {
    const response = await client.get('/v1/categories?page=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/categories?page=1000', async () => {
    const response = await client.get('/v1/categories?page=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/categories?size=', async () => {
    const response = await client.get('/v1/categories?size=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/categories?size=0', async () => {
    const response = await client.get('/v1/categories?size=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/categories?size=1.1', async () => {
    const response = await client.get('/v1/categories?size=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/categories?size=Y', async () => {
    const response = await client.get('/v1/categories?size=Y').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // exact 20 chars are working, but does not find any category
  it('invokes GET /v1/categories?starting=abcdefghijklmnopqrst', async () => {
    const response = await client.get('/v1/categories?starting=abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /v1/categories?starting=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/v1/categories?starting=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, not starting with an apostrophe
  it('invokes GET /v1/categories?starting=\' OR', async () => {
    const response = await client.get('/v1/categories?starting=\' OR').expect(400);
    response.text.should.containEql('BadRequestError');
  });


  //**********
  // authors *
  //**********

  // correct requests
  it('invokes GET /v1/authors', async () => {
    const response = await client.get('/v1/authors').expect(200);
    expect(100).to.equal(response.body.authors.length);
  });
  // this tests also that non-public authors are not given,
  // as the SQL dump contains 563 authors, including tha author entry #603 "Non-Public Author Entry"
  it('invokes GET /v1/authors?size=1000', async () => {
    const response = await client.get('/v1/authors?size=1000').expect(200);
    expect(562).to.equal(response.body.authors.length);
  });
  it('invokes GET /v1/authors?language=de&page=100&size=1', async () => {
    const response = await client.get('/v1/authors?language=de&page=100&size=1').expect(200);
    expect([{
      "authorId": 61,
      "lastname": "Creamer",
      "firstname": "Stephan",
      "description": "Inhaber und Mitbegründer der Coachingacademie Bielefeld",
      "name": "Stephan Creamer"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /v1/authors?language=es&page=120&size=1', async () => {
    const response = await client.get('/v1/authors?language=es&page=120&size=1').expect(200);
    expect([{
      "authorId": 525,
      "lastname": "Diekmann",
      "firstname": "Kai",
      "description": "Periodista y consultor alemán (n. 1964)",
      "link": "https://es.wikipedia.org/wiki/Kai_Diekmann",
      "name": "Kai Diekmann"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /v1/authors?language=ja&page=140&size=1', async () => {
    const response = await client.get('/v1/authors?language=ja&page=140&size=1').expect(200);
    expect([{
      "authorId": 106,
      "lastname": "コクトー",
      "firstname": "ジャン",
      "description": "フランスの作家、演出家、画家、振付家（1889年～1963年）",
      "link": "https://ja.wikipedia.org/wiki/ジャン・コクトー",
      "name": "コクトー・ジャン"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /v1/authors?language=uk&page=160&size=1', async () => {
    const response = await client.get('/v1/authors?language=uk&page=160&size=1').expect(200);
    expect([{
      "authorId": 171,
      "lastname": "Девіто",
      "firstname": "Денні",
      "description": "Американський актор (нар. 1944)",
      "link": "https://uk.wikipedia.org/wiki/Денні_Девіто",
      "name": "Денні Девіто"
    }]).to.eql(response.body.authors);
  });
  // if no language given, it defaults to :en
  it('invokes GET /v1/authors?page=200&size=1', async () => {
    const response = await client.get('/v1/authors?page=200&size=1').expect(200);
    expect({
      "language": "en",
      "totalCount": 562,
      "page": 200,
      "size": 1
    }).to.eql(response.body.paging);
    expect([{
      "authorId": 590,
      "lastname": "Hartung",
      "firstname": "Michael",
      "description": "from IBM",
      "name": "Michael Hartung"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /v1/authors?lastname=A&firstname=D&size=1', async () => {
    const response = await client.get('/v1/authors?lastname=A&firstname=D&size=1').expect(200);
    expect([{
      "authorId": 345,
      "lastname": "Adams",
      "firstname": "Douglas",
      "description": "British writer (1952 - 2001)",
      "link": "https://en.wikipedia.org/wiki/Douglas_Adams",
      "name": "Douglas Adams"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /v1/authors?description=British%20actress', async () => {
    const response = await client.get('/v1/authors?description=British%20actress').expect(200);
    expect([{
      "authorId": 339,
      "lastname": "Andrews",
      "firstname": "Julie",
      "description": "British actress, singer and writer (born 1935)",
      "link": "https://en.wikipedia.org/wiki/Julie_Andrews",
      "name": "Julie Andrews"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /v1/authors?lfd=Adams,H', async () => {
    const response = await client.get('/v1/authors?lfd=Adams,H').expect(200);
    expect([{
      "authorId": 92,
      "lastname": "Adams",
      "firstname": "Henry",
      "description": "US-American historian and cultural philosopher (1838 - 1918)",
      "link": "https://en.wikipedia.org/wiki/Henry_Adams",
      "name": "Henry Adams"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /v1/authors?lfd=,Karen', async () => {
    const response = await client.get('/v1/authors?lfd=,Karen').expect(200);
    expect([{
      "authorId": 18,
      "firstname": "Karen, 7 years",
      "description": "asked: What does love mean?",
      "name": "Karen, 7 years"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /v1/authors?language=de&lfd=Adenauer,Konrad,Deutscher%20Politiker', async () => {
    const response = await client.get('/v1/authors?language=de&lfd=Adenauer,Konrad,Deutscher%20Politiker').expect(200);
    expect([{
      "authorId": 243,
      "lastname": "Adenauer",
      "firstname": "Konrad",
      "description": "Deutscher Politiker und Bundeskanzler (1876 – 1967)",
      "link": "https://de.wikipedia.org/wiki/Konrad_Adenauer",
      "name": "Konrad Adenauer"
    }]).to.eql(response.body.authors);
  });
  it('invokes GET /v1/authors?lfd=&size=1000', async () => {
    const response = await client.get('/v1/authors?lfd=&size=1000').expect(200);
    expect(response.body.authors.length).to.equal(562);
  });

  // issue #4 authors without last name at the end
  it('retrieves the first author entry and checks that lastname is set', async () => {
    const response = await client.get('/v1/authors?language=en&page=1&size=1').expect(200);
    expect(response.body.authors).to.have.lengthOf(1);
    expect(response.body.authors[0]).to.have.property('lastname');
    expect(response.body.authors[0]).to.have.property('firstname');
  });
  it('retrieves the the last author entry and checks that lastname is not set', async () => {
    let response = await client.get('/v1/authors?size=1').expect(200);
    const totalCount = response.body.paging.totalCount;
    response = await client.get(`/v1/authors?page=${totalCount}&size=1`).expect(200);
    expect(response.body.authors).to.have.lengthOf(1);
    expect(response.body.authors[0]).to.not.have.property('lastname');
    expect(response.body.authors[0]).to.have.property('firstname');
  });

  // incorrect parameters
  it('invokes GET /v1/authors?language=', async () => {
    const response = await client.get('/v1/authors?language=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/authors?language=XXX', async () => {
    const response = await client.get('/v1/authors?language=XXX').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/authors?page=', async () => {
    const response = await client.get('/v1/authors?page=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/authors?page=0', async () => {
    const response = await client.get('/v1/authors?page=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/authors?page=1.1', async () => {
    const response = await client.get('/v1/authors?page=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/authors?page=A', async () => {
    const response = await client.get('/v1/authors?page=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/authors?page=1000', async () => {
    const response = await client.get('/v1/authors?page=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/authors?size=', async () => {
    const response = await client.get('/v1/authors?size=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/authors?size=0', async () => {
    const response = await client.get('/v1/authors?size=0').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/authors?size=1.1', async () => {
    const response = await client.get('/v1/authors?size=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/authors?size=Y', async () => {
    const response = await client.get('/v1/authors?size=Y').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/authors?lfd=X,Y,Z', async () => {
    const response = await client.get('/v1/authors?lfd=X,Y,Z').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/authors?lastname=XXX', async () => {
    const response = await client.get('/v1/authors?lastname=XXX').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/authors?firstname=YYY', async () => {
    const response = await client.get('/v1/authors?firstname=YYY').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/authors?description=ZZZ', async () => {
    const response = await client.get('/v1/authors?description=ZZZ').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // exact 20 chars are working, but does not find any user
  it('invokes GET /v1/authors?lastname=abcdefghijklmnopqrst', async () => {
    const response = await client.get('/v1/authors?lastname=abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /v1/authors?lastname=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/v1/authors?lastname=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, not starting with an apostrophe
  it('invokes GET /v1/authors?lastname=\' OR', async () => {
    const response = await client.get('/v1/authors?lastname=\' OR').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // exact 20 chars are working, but does not find any user
  it('invokes GET /v1/authors?firstname=abcdefghijklmnopqrst', async () => {
    const response = await client.get('/v1/authors?firstname=abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /v1/authors?firstname=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/v1/authors?firstname=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, not starting with an apostrophe
  it('invokes GET /v1/authors?firstname=\' OR', async () => {
    const response = await client.get('/v1/authors?firstname=\' OR').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // exact 20 chars are working, but does not find any user
  it('invokes GET /v1/authors?description=abcdefghijklmnopqrst', async () => {
    const response = await client.get('/v1/authors?description=abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /v1/authors?description=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/v1/authors?description=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, not starting with an apostrophe
  it('invokes GET /v1/authors?description= \' OR', async () => {
    const response = await client.get('/v1/authors?description= \' OR').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // exact 20 chars are working, but does not find any user
  it('invokes GET /v1/authors?lfd=abcdefghijklmnopqrst,abcdefghijklmnopqrst,abcdefghijklmnopqrst', async () => {
    const response = await client.get('/v1/authors?lfd=abcdefghijklmnopqrst,abcdefghijklmnopqrst,abcdefghijklmnopqrst').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  // SQL injection, not more than 20 chars
  it('invokes GET /v1/authors?lfd=abcdefghijklmnopqrstu', async () => {
    const response = await client.get('/v1/authors?lfd=abcdefghijklmnopqrstu').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // SQL injection, not starting with an apostrophe
  it('invokes GET /v1/authors?lfd=  \' OR', async () => {
    const response = await client.get('/v1/authors?lfd=  \' OR').expect(400);
    response.text.should.containEql('BadRequestError');
  });

  // **********
  // * author *
  // **********
  it('invokes GET /v1/author?authorId=597&language=ja', async () => {
    const response = await client.get('/v1/author?authorId=597&language=ja').expect(200);
    expect({
      author: {
        authorId: 597,
        lastname: "坂本",
        firstname: "龍一",
        description: "日本の作曲家、ピアニスト、プロデューサー、俳優、モデル（1952年～2023年）",
        link: "https://ja.wikipedia.org/wiki/坂本龍一",
        name: "坂本・龍一"
      }
    }).to.eql(response.body);
  });
  // missing language defaults to :en
  it('invokes GET /v1/author?authorId=597', async () => {
    const response = await client.get('/v1/author?authorId=597').expect(200);
    expect({
      author: {
        authorId: 597,
        lastname: "Sakamoto",
        firstname: "Ryuichi",
        description: "Japanese composer, pianist, producer, actor and model (1952 - 2023)",
        link: "https://en.wikipedia.org/wiki/Ryuichi_Sakamoto",
        name: "Ryuichi Sakamoto"
      }
    }).to.eql(response.body);
  });

  // incorrect parameters
  it('invokes GET /v1/author?authorId=1000', async () => {
    const response = await client.get('/v1/author?authorId=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/author?authorId=-1', async () => {
    const response = await client.get('/v1/author?authorId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/author?authorId=1.1', async () => {
    const response = await client.get('/v1/author?authorId=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/author?authorId=', async () => {
    const response = await client.get('/v1/author?authorId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/author?authorId=A', async () => {
    const response = await client.get('/v1/author?authorId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/author?authorId=597&language=', async () => {
    const response = await client.get('/v1/author?authorId=597&language=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/author?authorId=597&language=XXX', async () => {
    const response = await client.get('/v1/author?authorId=597&language=XXX').expect(400);
    response.text.should.containEql('BadRequestError');
  });

  //********
  // quote *
  //********

  it('invokes GET /v1/quote', async () => {
    const response = await client.get('/v1/quote').expect(200);
    expect(response.body).to.have.property('quote');
    expect(response.body).to.have.property('link');
  });
  // explicit testing authorID 0 (unknown)
  it('invokes GET /v1/quote?authorId=0', async () => {
    const response = await client.get('/v1/quote?authorId=0').expect(200);
    expect(response.body).to.have.property('quote');
    expect(response.body).to.have.property('link');
    expect(response.body).to.have.property('authorId', 0);
    expect(response.body).to.have.property('authorName');
  });
  // following tests are figured out with exactly one quote returned
  it('invokes GET /v1/quote?authorId=601', async () => {
    const response = await client.get('/v1/quote?authorId=601').expect(200);
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
  it('invokes GET /v1/quote?userId=97&language=de', async () => {
    const response = await client.get('/v1/quote?userId=97&language=de').expect(200);
    expect({
      quote: "Missverständnis? Die häufigste Form menschlicher Kommunikation.",
      language: "de",
      link: "https://www.zitat-service.de/de/quotations/1527",
      authorId: 439,
      authorName: "Peter Benary",
      authorLink: "https://de.wikipedia.org/wiki/Peter_Benary"
    }).to.eql(response.body);
  });
  it('invokes GET /v1/quote?authorId=0&categoryId=16&userId=73&language=es', async () => {
    const response = await client.get('/v1/quote?authorId=0&categoryId=16&userId=73&language=es').expect(200);
    expect({
      quote: "Vivir con miedo, es como vivir a medias.",
      language: "es",
      link: "https://www.zitat-service.de/es/quotations/1903",
      authorId: 0,
      authorName: "Desconocido"
    }).to.eql(response.body);
  });
  it('invokes GET /v1/quote?authorId=33&categoryId=501&language=de', async () => {
    const response = await client.get('/v1/quote?authorId=33&categoryId=501&language=de').expect(200);
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
  it('invokes GET /v1/quote?userId=', async () => {
    const response = await client.get('/v1/quote?userId=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?userId=-1', async () => {
    const response = await client.get('/v1/quote?userId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?userId=1.1', async () => {
    const response = await client.get('/v1/quote?userId=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?userId=A', async () => {
    const response = await client.get('/v1/quote?userId=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?userId=1000', async () => {
    const response = await client.get('/v1/quote?userId=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/quote?authorId=', async () => {
    const response = await client.get('/v1/quote?authorId=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?authorId=-1', async () => {
    const response = await client.get('/v1/quote?authorId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?authorId=1.1', async () => {
    const response = await client.get('/v1/quote?authorId=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?authorId=A', async () => {
    const response = await client.get('/v1/quote?authorId=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?authorId=1000', async () => {
    const response = await client.get('/v1/quote?authorId=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/quote?categoryId=', async () => {
    const response = await client.get('/v1/quote?categoryId=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?categoryId=-1', async () => {
    const response = await client.get('/v1/quote?categoryId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?categoryId=1.1', async () => {
    const response = await client.get('/v1/quote?categoryId=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?categoryId=A', async () => {
    const response = await client.get('/v1/quote?categoryId=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?categoryId=1000', async () => {
    const response = await client.get('/v1/quote?categoryId=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/quote?language=', async () => {
    const response = await client.get('/v1/quote?language=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote?language=XXX', async () => {
    const response = await client.get('/v1/quote?language=XXX').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // testing #1919 non-public quote with non-public category #623
  it('invokes GET /v1/quote?categoryId=623', async () => {
    const response = await client.get('/v1/quote?categoryId=623').expect(404);
    response.text.should.containEql('NotFoundError');
  });

  //*************
  // quote_html *
  //*************

  it('invokes GET /v1/quote_html', async () => {
    const response = await client.get('/v1/quote_html').expect(200);
    response.text.should.containEql('<!DOCTYPE html>');
    response.text.should.containEql('<div class="quote"><div class="quotation"><a href="');
    response.text.should.not.containEql('target="');
  });
  it('invokes GET /v1/quote_html?contentOnly=true', async () => {
    const response = await client.get('/v1/quote_html?contentOnly=true').expect(200);
    response.text.should.not.containEql('<!DOCTYPE html>');
    response.text.should.containEql('<div class="quote"><div class="quotation"><a href="');
    response.text.should.not.containEql('target="');
  });
  it('invokes GET /v1/quote_html?contentOnly=false', async () => {
    const response = await client.get('/v1/quote_html?contentOnly=false').expect(200);
    response.text.should.containEql('<!DOCTYPE html>\n');
    response.text.should.containEql('<div class="quote"><div class="quotation"><a href="');
    response.text.should.not.containEql('target="');
  });
  it('invokes GET /v1/quote_html?target=quote_window', async () => {
    const response = await client.get('/v1/quote_html?target=quote_window').expect(200);
    response.text.should.containEql('target="quote_window"');
    response.text.should.containEql('<div class="quote"><div class="quotation"><a href="');
  });
  // explicit testing authorID 0 (unknown) and using category+user as there is only one quote w/o source
  it('invokes GET /v1/quote_html?authorId=0&categoryId=545&userId=85', async () => {
    const response = await client.get('/v1/quote_html?authorId=0&categoryId=545&userId=85').expect(200);
    response.text.should.containEql('<div class="quote"><div class="quotation"><a href="');
    response.text.should.not.containEql('<div class="source">');
  });
  // following tests are figured out with exactly one quote returned
  it('invokes GET /v1/quote_html?authorId=601', async () => {
    const response = await client.get('/v1/quote_html?authorId=601').expect(200);
    response.text.should.containEql(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>www.zitat-service.de</title>
</head>
<body>
  <div class="quote"><div class="quotation"><a href="https://www.zitat-service.de/en/quotations/1906">Dance is the hidden language of the soul.</a></div><div class="source"><a href="https://archive.nytimes.com/www.nytimes.com/library/arts/033185graham.html">Martha Graham Reflects on Her Art and a Life in Dance, The New York Times, 1985</a>, <a href="https://en.wikipedia.org/wiki/Martha_Graham">Martha Graham</a></div></div>
</body>
</html>
`);
  });
  it('invokes GET /v1/quote_html?userId=97&language=de', async () => {
    const response = await client.get('/v1/quote_html?userId=97&language=de').expect(200);
    response.text.should.containEql(
      `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>www.zitat-service.de</title>
</head>
<body>
  <div class="quote"><div class="quotation"><a href="https://www.zitat-service.de/de/quotations/1527">Missverständnis? Die häufigste Form menschlicher Kommunikation.</a></div><div class="source"><a href="https://de.wikipedia.org/wiki/Peter_Benary">Peter Benary</a></div></div>
</body>
</html>
`);
  });
  it('invokes GET /v1/quote_html?authorId=0&categoryId=16&userId=73&language=es', async () => {
    const response = await client.get('/v1/quote_html?authorId=0&categoryId=16&userId=73&language=es').expect(200);
    response.text.should.containEql(
      `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>www.zitat-service.de</title>
</head>
<body>
  <div class="quote"><div class="quotation"><a href="https://www.zitat-service.de/es/quotations/1903">Vivir con miedo, es como vivir a medias.</a></div></div>
</body>
</html>
`);
  });
  it('invokes GET /v1/quote_html?authorId=33&categoryId=501&language=de', async () => {
    const response = await client.get('/v1/quote_html?authorId=33&categoryId=501&language=de').expect(200);
    response.text.should.containEql(
      `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>www.zitat-service.de</title>
</head>
<body>
  <div class="quote"><div class="quotation"><a href="https://www.zitat-service.de/de/quotations/1687">Was nicht umstritten ist, ist auch nicht sonderlich interessant.</a></div><div class="source"><a href="https://de.wikipedia.org/wiki/Johann_Wolfgang_von_Goethe">Johann Wolfgang von Goethe</a></div></div>
</body>
</html>
`);
  });

  // incorrect parameters
  it('invokes GET /v1/quote_html?userId=', async () => {
    const response = await client.get('/v1/quote_html?userId=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?userId=-1', async () => {
    const response = await client.get('/v1/quote_html?userId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?userId=1.1', async () => {
    const response = await client.get('/v1/quote_html?userId=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?userId=A', async () => {
    const response = await client.get('/v1/quote_html?userId=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?userId=1000', async () => {
    const response = await client.get('/v1/quote_html?userId=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/quote_html?authorId=', async () => {
    const response = await client.get('/v1/quote_html?authorId=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?authorId=-1', async () => {
    const response = await client.get('/v1/quote_html?authorId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?authorId=1.1', async () => {
    const response = await client.get('/v1/quote_html?authorId=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?authorId=A', async () => {
    const response = await client.get('/v1/quote_html?authorId=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?authorId=1000', async () => {
    const response = await client.get('/v1/quote_html?authorId=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/quote_html?categoryId=', async () => {
    const response = await client.get('/v1/quote_html?categoryId=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?categoryId=-1', async () => {
    const response = await client.get('/v1/quote_html?categoryId=-1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?categoryId=1.1', async () => {
    const response = await client.get('/v1/quote_html?categoryId=1.1').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?categoryId=A', async () => {
    const response = await client.get('/v1/quote_html?categoryId=A').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?categoryId=1000', async () => {
    const response = await client.get('/v1/quote_html?categoryId=1000').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/quote_html?language=', async () => {
    const response = await client.get('/v1/quote_html?language=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?language=XXX', async () => {
    const response = await client.get('/v1/quote_html?language=XXX').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  // testing #1919 non-public quote with non-public category #623
  it('invokes GET /v1/quote_html?categoryId=623', async () => {
    const response = await client.get('/v1/quote_html?categoryId=623').expect(404);
    response.text.should.containEql('NotFoundError');
  });
  it('invokes GET /v1/quote_html?contentOnly=', async () => {
    const response = await client.get('/v1/quote_html?contentOnly=').expect(400);
    response.text.should.containEql('BadRequestError');
  });
  it('invokes GET /v1/quote_html?contentOnly=oops', async () => {
    const response = await client.get('/v1/quote_html?contentOnly=oops').expect(400);
    response.text.should.containEql('BadRequestError');
  });
});
