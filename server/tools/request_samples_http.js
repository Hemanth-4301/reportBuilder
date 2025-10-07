const http = require('http');

const postJson = (path, body) => new Promise((resolve, reject) => {
  const data = JSON.stringify(body);
  const options = {
    hostname: 'localhost',
    port: 5000,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, (res) => {
    let raw = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => raw += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(raw);
        resolve({ statusCode: res.statusCode, body: json });
      } catch (e) {
        resolve({ statusCode: res.statusCode, body: raw });
      }
    });
  });

  req.on('error', (e) => reject(e));
  req.write(data);
  req.end();
});

(async () => {
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
    console.log('\n=== Request:', s.name, '===');
    try {
      const res = await postJson('/api/reports/generate-report', s.body);
      console.log('Status:', res.statusCode);
      console.log(JSON.stringify(res.body, null, 2));
    } catch (err) {
      console.error('Request failed for', s.name, err.message || err);
    }
  }
})();
