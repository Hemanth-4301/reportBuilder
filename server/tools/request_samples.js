(async () => {
  const base = 'http://localhost:5000/api/reports/generate-report';
  const headers = { 'Content-Type': 'application/json' };

  const samples = [
    {
      name: 'single-table-bar',
      body: {
        dataModel: { collections: ['production'], fields: ['productId', 'quantity'] },
        visualization: { type: 'bar' },
        filters: {}
      }
    },
    {
      name: 'multi-table-multibar',
      body: {
        dataModel: { collections: ['production', 'defects'], fields: ['productId', 'quantity', 'defectCount'] },
        visualization: { type: 'multi-bar', categoryField: 'productId', valueFields: ['quantity','defectCount'] },
        filters: {}
      }
    }
  ];

  for (const s of samples) {
    try {
      console.log('\n=== Request:', s.name, '===');
      const res = await fetch(base, { method: 'POST', headers, body: JSON.stringify(s.body) });
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Non-JSON response or parse error, raw text:');
        console.log(text);
      }
    } catch (err) {
      console.error('Request failed for', s.name, err.message || err);
    }
  }
})();
