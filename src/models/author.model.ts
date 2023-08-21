import {Entity, model, property} from '@loopback/repository';

@model()
export class Author extends Entity {
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
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  firstname: string;

  @property({
    type: 'string',
    required: true,
  })
  description: string;

  @property({
    type: 'string',
    required: true,
  })
  link: string;

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
