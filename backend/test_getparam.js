
const normalize = (s) => s?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

const getParamTest = (name, obj) => {
    const searchKey = normalize(name);
    const findIn = (obj) => {
      if (!obj) return null;
      const matchKey = Object.keys(obj).find(k => normalize(k) === searchKey);
      return matchKey ? obj[matchKey] : null;
    };
    return findIn(obj);
};

const payload = { 'CustomField': 'test-123', 'village_id': 'V001', 'passthru': 'P99' };

console.log('Testing custom_field (payload has CustomField):', getParamTest('custom_field', payload));
console.log('Testing villageid (payload has village_id):', getParamTest('villageid', payload));
console.log('Testing PASSTHRU:', getParamTest('PASSTHRU', payload));
console.log('Testing non-existent:', getParamTest('missing', payload));
