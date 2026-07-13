export type FieldRule<T> = {
  isValid: (value: string) => boolean;
  corrections: Array<(value: string) => string>;
  parse: (value: string) => T;
};

export function checkAndCorrect<T>(raw: string, rule: FieldRule<T>): { value: T; corrected: boolean; needsReview: boolean } {
  const trimmed = raw.trim();
  if (rule.isValid(trimmed)) {
    return { value: rule.parse(trimmed), corrected: false, needsReview: false };
  }
  const candidate = rule.corrections.reduce((v, fix) => fix(v), trimmed);
  if (rule.isValid(candidate)) {
    return { value: rule.parse(candidate), corrected: true, needsReview: false };
  }
  return { value: rule.parse(trimmed), corrected: false, needsReview: true };
}

export const AIRCRAFT_RULE: FieldRule<string> = {
  isValid: (v) => /^[A-Z]{1,4}-?\d{2,4}[A-Z]{0,2}$/i.test(v),
  corrections: [
    (v) => v.replace(/\s+/g, ''),          // "C 172" -> "C172"
    (v) => v.replace(/^\(/, 'C'),          // "(172" -> "C172" - open paren misread for C
    (v) => v.replace(/^0(?=[-\d])/, 'C'),  // "0172" / "0-172" -> "C172" / "C-172"
  ],
  parse: (v) => v.toUpperCase(),
};

export const DECIMAL_HOURS_RULE: FieldRule<number> = {
  isValid: (v) => /^\d{1,2}\.\d{1,2}$/.test(v),
  corrections: [
    (v) => v.replace(/^(\d{1,2})[,\-\s](\d{1,2})$/, '$1.$2'), // "4,1"/"4-1"/"4 1" -> "4.1"
    (v) => v.replace(/^(\d)(\d)$/, '$1.$2'),                   // "41" -> "4.1" (exactly 2 bare digits only)
  ],
  parse: (v) => parseFloat(v) || 0,
};

export const HM_HOURS_RULE: FieldRule<number> = {
  isValid: (v) => /^\d{1,3}:\d{2}$/.test(v),
  corrections: [
    (v) => v.replace(/^(\d{1,3})[.,\-](\d{2})$/, '$1:$2'), // wrong separator used instead of colon
  ],
  parse: (v) => {
    const [h, m] = v.split(':').map(Number);
    return h + m / 60;
  },
};

export const DATE_RULE: FieldRule<string> = {
  isValid: (v) => {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    const year = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
    return year >= 1990 && year <= new Date().getFullYear() && month >= 1 && month <= 12 && day >= 1 && day <= 31;
  },
  corrections: [], // nothing safe to guess here - an implausible date just needs a human
  parse: (v) => v,
};
