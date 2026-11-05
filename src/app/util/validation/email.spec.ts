import { isValidEmail } from './email';

describe('isValidEmail', () => {
  it('accepts empty input because the fields are optional', () => {
    expect(isValidEmail('')).toBe(true);
    expect(isValidEmail('   ')).toBe(true);
  });

  it('accepts regular addresses, also with surrounding spaces', () => {
    expect(isValidEmail('max@firma.de')).toBe(true);
    expect(isValidEmail('  vorname.nachname+crm@sub.firma.co.uk  ')).toBe(true);
  });

  it('rejects addresses without domain part or top level domain', () => {
    expect(isValidEmail('max@firma')).toBe(false);
    expect(isValidEmail('max.firma.de')).toBe(false);
    expect(isValidEmail('@firma.de')).toBe(false);
  });

  it('rejects whitespace inside the address', () => {
    expect(isValidEmail('max mustermann@firma.de')).toBe(false);
  });
});
