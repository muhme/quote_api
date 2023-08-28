import {expect} from '@loopback/testlab';
import {LanguagesController} from '../../controllers';

describe('LocalesController', () => {
  let controller: LanguagesController;

  before('setup controller', () => {
    controller = new LanguagesController();
  });

  describe('getAvailableLocales()', () => {
    it('returns expected locales', async () => {
      const result = await controller.getAvailableLanguages();
      expect(result).to.deepEqual(["de", "en", "es", "ja", "uk"]);
    });
  });
});
