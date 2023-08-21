import {Entity, model, property} from '@loopback/repository';

@model()
export class User extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @property({
    type: 'string',
    required: true,
  })
  login: string;

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  totalCount: number;

  constructor(data?: Partial<User>) {
    super(data);
  }
}
