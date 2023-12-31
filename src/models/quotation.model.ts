import {Entity, model, property} from '@loopback/repository';

@model()
export class Quotation extends Entity {

  @property({
    type: 'number',
    id: true,
    generated: true,
  }) id: number;

  @property({
    type: 'string',
    required: true,
  }) quotation: string;

  @property({
    type: 'string',
    required: true,
  }) language: string;

  @property({
    type: 'string',
    required: true,
  }) quotationLink: string;

  @property({
    type: 'string',
  }) source: string;

  @property({
    type: 'string',
  }) sourceLink: string;

  @property({
    type: 'number',
    id: true,
    generated: true,
  }) authorId: number;

  constructor(data?: Partial<Quotation>) {
    super(data);
  }
}
