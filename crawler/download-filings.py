from sec_edgar_downloader import Downloader

# List of tickers from the test pack
tickers = ['MULN', 'FFIE', 'HUBC', 'NVOS', 'GFAI', 'SOAR', 'RCAT', 'GNS', 'HLBZ', 'PRTY']

dl = Downloader('MyCompany', './test_corpus')

for ticker in tickers:
    try:
        print(f"Downloading {ticker}...")
        dl.get("8-K", ticker, limit=5)  # Get last 5 8-Ks
        dl.get("10-Q", ticker, limit=3)
    except Exception as e:
        print(f"  Error: {e}")

print("\n✅ Done! Filings in ./test_corpus/")
