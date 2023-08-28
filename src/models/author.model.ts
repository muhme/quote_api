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
    type: 'string'
  })
  lastname?: string;

  @property({
    type: 'string'
  })
  firstname?: string;

  @property({
    type: 'string'
  })
  description?: string;

  @property({
    type: 'string'
  })
  link?: string;

  constructor(data?: Partial<Author>) {
    super(data);
  }

}

/**
 * create name from firstname and lastname
 *
 * @param firstname - possible more than one, or additional patronyms or titles
 * @param lastname - surname
 * @param language
 * @returns e.g.
 *   "Abraham Lincoln" for "en"
 *   "リンカーン・エイブラハム" for "ja"
 */
export function combineAuthorName(firstname: string | undefined, lastname: string | undefined, language: string): string {
  firstname = firstname ?? "";
  lastname = lastname ?? "";
  let name;
  if (language === "ja") {
    if (lastname && firstname) {
      name = `${lastname}・${firstname}`;
    } else {
      name = lastname || firstname;
    }
  } else {
    if (firstname && lastname) {
      name = `${firstname} ${lastname}`;
    } else {
      name = firstname || lastname;
    }
  }
  return name;
}
