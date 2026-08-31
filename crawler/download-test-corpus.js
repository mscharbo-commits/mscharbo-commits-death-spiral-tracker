const fs = require('fs');
const path = require('path');
const axios = require('axios');

const urls = [
  "https://www.sec.gov/Archives/edgar/data/1499961/000182912624005824/0001829126-24-005824-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1499961/000182912625004199/0001829126-25-004199-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1805521/000121390024076294/0001213900-24-076294-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1805521/000121390024089112/0001213900-24-089112-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1905660/000121390023090214/0001213900-23-090214-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1905660/000121390023101222/0001213900-23-101222-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1138978/000149315224025430/0001493152-24-025430-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1138978/000149315225004329/0001493152-25-004329-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1804469/000121390024022883/0001213900-24-022883-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1804469/000121390024033221/0001213900-24-033221-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1853070/000162828024049987/0001628280-24-049987-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1757715/000149315224018931/0001493152-24-018931-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1717556/000149315223028579/0001493152-23-028579-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1309082/000147793224005095/0001477932-24-005095-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1584509/000119312523241981/0001193125-23-241981-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1616543/000121390024011101/0001213900-24-011101-index.htm",
  "https://www.sec.gov/Archives/edgar/data/748268/000164117225015576/0001641172-25-015576-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1841801/000149315223017818/0001493152-23-017818-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1750163/000149315223030192/0001493152-23-030192-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1524358/000110465923097432/0001104659-23-097432-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1710350/000149315224019482/0001493152-24-019482-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1167419/000119312524019881/0001193125-24-019881-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1507605/000162828024010994/0001628280-24-010994-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1296484/000110465924011872/0001104659-24-011872-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1620179/000121390024004981/0001213900-24-004981-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1820273/000121390024003112/0001213900-24-003112-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1820302/000119312524020811/0001193125-24-020811-index.htm",
  "https://www.sec.gov/Archives/edgar/data/1841209/000121390024009001/0001213900-24-009001-index.htm"
];

async function downloadFilings() {
  const corpus = 'test_corpus';
  if (!fs.existsSync(corpus)) fs.mkdirSync(corpus);

  for (const url of urls) {
    const filename = url.split('/').pop();
    const filepath = path.join(corpus, filename + '.html');
    
    try {
      console.log(`Downloading ${filename}...`);
      const response = await axios.get(url, { timeout: 15000 });
      fs.writeFileSync(filepath, response.data);
      console.log(`✓ Saved ${filename}`);
    } catch (error) {
      console.error(`✗ Failed ${filename}:`, error.message);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n✅ Download complete! Files in ./test_corpus/');
}

downloadFilings();
