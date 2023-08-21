import {Entity, model, property} from '@loopback/repository';

@model()
export class Category extends Entity {
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
  category: string;

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  totalCount: number;

  constructor(data?: Partial<Category>) {
    super(data);
  }
}
