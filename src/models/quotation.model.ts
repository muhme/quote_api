import {Entity, model, property} from '@loopback/repository';
import {Author} from './author.model';

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
  }) quotationLink: string;

  @property({
    type: 'string',
    required: true,
  }) source: string;

  @property({
    type: 'string',
    required: true,
  }) sourceLink: string;

  @property({
    type: 'number',
    id: true,
    generated: true,
  }) authorId?: number;
  // having author ID optional to be able to delete
  // first we need the author ID to retrieve the Author
  // but afterwards author ID is doubled in sub-entry Author
  // and we will delete it in Quotation

  author: Author;  // author sub-entry in quote

  constructor(data?: Partial<Quotation>) {
    super(data);
  }
}

export interface QuotationRelations {
  // describe navigational properties here
}

export type QuotationWithRelations = Quotation & QuotationRelations;
