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

  it('retrieves list of users', async () => {
    const result = await controller.getUsers();
    expect(result.length).to.equal(fixtures.users.length);
    /* map MySQL RowDataPacket into JavaScript Object */
    const plainObjectsArray = result.map(row => Object.assign({}, row));
    expect(plainObjectsArray).to.eql(fixtures.users);
  });
});
