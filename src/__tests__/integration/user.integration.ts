import {expect} from '@loopback/testlab';
import {QuoteApiApplication} from '../..';
import {UsersController} from '../../controllers';
import {UsersRepository} from '../../repositories';
import {fixtures} from '../fixtures';

describe('UsersController (integration)', () => {
  let app: QuoteApiApplication;
  let controller: UsersController;
  let userRepository: UsersRepository;

  before(async () => {
    app = new QuoteApiApplication();
    await app.boot();

    // You can use the real datasources and repositories here, or use test versions
    userRepository = await app.getRepository(UsersRepository);
    controller = new UsersController(userRepository);
  });

  after(async () => {
    await app.stop();
  });

  // only to prevent lint grumble using type <any> and I do not know where to import <RowDataPacket> from
  interface UserRow {
    id: number;
    login: string;
  }
  /* map MySQL RowDataPacket into JavaScript Object */
  function mapToPlainObjectArray(rows: Array<UserRow>): Array<Object> {
    return rows.map(row => Object.assign({}, row));
  }

  // This test includes to verify only users with quotations are found.
  // MySQL database contains users w/o quotations and fixtures.users
  // are the subset of users with quotations.
  it('retrieves list of users w/o any parameters', async () => {
    const result = await controller.getUsers();
    expect(result.length).to.equal(fixtures.users.length);
    expect(mapToPlainObjectArray(result)).to.eql(fixtures.users);
  });
  it('retrieves list of users with size', async () => {
    const result = await controller.getUsers(undefined, 3);
    expect(mapToPlainObjectArray(result)).to.eql(fixtures.users.slice(0, 3));
  });
  it('retrieves list of users with starting page and size', async () => {
    const result = await controller.getUsers(2, 10);
    expect(mapToPlainObjectArray(result)).to.eql(fixtures.users.slice(10, 20));
  });
  it('retrieves list of users with starting letter H', async () => {
    const result = await controller.getUsers(undefined, undefined, "H");
    expect(mapToPlainObjectArray(result)).to.eql(fixtures.users.filter(user => user.login[0].toLowerCase() === 'h'));
  });
  it('retrieves list of users with starting letters HE', async () => {
    const result = await controller.getUsers(undefined, undefined, "HE");
    expect(mapToPlainObjectArray(result)).to.eql(fixtures.users.filter(user => user.login.substring(0, 2).toLowerCase() === 'he'));
  });
  it('retrieves list of users with starting letters Heiko', async () => {
    const result = await controller.getUsers(1, 100, "Heiko");
    expect(mapToPlainObjectArray(result)).to.eql(fixtures.users.filter(user => user.login.toLowerCase() === 'heiko'));
  });
  it('returns an empty result with starting letters cheesecake', async () => {
    const result = await controller.getUsers(undefined, undefined, "cheesecake");
    expect(result).to.be.empty;
  });

});
