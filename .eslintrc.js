module.exports = {
  extends: '@loopback/eslint-config',
  // prevent standalone expressions are potentially problematic, e.g. expect(result).to.be.empty
  plugins: ['chai-friendly'],
  rules: {
    'no-unused-expressions': 'off',
    'chai-friendly/no-unused-expressions': 'error',
  },
};
