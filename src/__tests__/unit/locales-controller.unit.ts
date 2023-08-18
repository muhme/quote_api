import {expect} from '@loopback/testlab';
import {LocalesController} from '../../controllers';

describe('LocalesController', () => {
  let controller: LocalesController;

  before('setup controller', () => {
    controller = new LocalesController();
  });

  describe('getAvailableLocales()', () => {
    it('returns expected locales', async () => {
      const result = await controller.getAvailableLocales();
      expect(result).to.deepEqual(["de", "en", "es", "ja", "uk"]);
    });
  });
});
