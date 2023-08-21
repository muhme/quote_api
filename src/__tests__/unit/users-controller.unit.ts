/*
import {expect, sinon} from '@loopback/testlab';
import {UsersController} from '../../controllers';
import {User} from '../../models';
import {UsersRepository} from '../../repositories';

describe('UsersController', () => {
  let usersRepositoryStub: sinon.SinonStubbedInstance<UsersRepository>;
  let controller: UsersController;

  beforeEach(givenStubbedRepository);

  const mockUsers: User[] = [
    {
      id: 1,
      login: 'alice'
    },
    {
      id: 2,
      login: 'bob'
    },
    {
      id: 3,
      login: 'charlie'
    },
    {
      id: 4,
      login: 'david'
    },
    {
      id: 5,
      login: 'eve'
    },
  ] as User[];


  it('retrieves users without any parameters', async () => {
    usersRepositoryStub.findUsersWithQuotations.resolves(mockUsers);

    const result = await controller.getUsers();
    expect(result).to.deepEqual(mockUsers);
  });

  it('retrieves users wit page parameter', async () => {
    usersRepositoryStub.findUsersWithQuotations.resolves(mockUsers);

    const result = await controller.getUsers(1);
    expect(result).to.deepEqual(mockUsers);
  });

  it('retrieves users with page and size parameter', async () => {
    usersRepositoryStub.findUsersWithQuotations.resolves(mockUsers);

    const result = await controller.getUsers(1, 10);
    expect(result).to.deepEqual(mockUsers);
  });

  function givenStubbedRepository() {
    usersRepositoryStub = sinon.createStubInstance(UsersRepository);
    controller = new UsersController(usersRepositoryStub as unknown as UsersRepository);
  }
});
*/
