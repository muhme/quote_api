import {Entity, model, property} from '@loopback/repository';

@model()
export class Author extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  // this is constructed as "lastname・firstname" for :ja and "firstname lastname" all other languages
  @property({
    type: 'string',
    required: true,
  })
  name: string;

  // this is the name field in DB
  @property({
    type: 'string',
    required: false,
  })
  lastname?: string;

  @property({
    type: 'string',
    required: false,
  })
  firstname?: string;

  @property({
    type: 'string',
    required: false,
  })
  description?: string;

  @property({
    type: 'string',
    required: false,
  })
  link?: string;

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  totalCount: number;

  constructor(data?: Partial<Author>) {
    super(data);
  }
}
