# City fallback directory

Data © GeoNames, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Source: https://download.geonames.org/export/dump/

`cities.json` is derived from `cities15000.zip`, `admin1CodesASCII.txt`, and `countryInfo.txt`. It covers populated places over 15,000 people and administrative capitals, rather than every town. Names and regional labels are bounded to app field lengths, coordinates rounded to four decimals, and search text transliterated and folded. No member data is included.

Rows: GeoNames ID, city, region, country, latitude, longitude, population, folded city name, search context. `cities-source.json` records source hashes and generation date. Refresh with `python3 scripts/update-city-directory.py`, then review the output before publishing.

The server loads this directory when live Photon lookup fails or returns no result. Reverse fallback offers only city points within 50 km. Account checks, request limits, selection tokens, and explicit user selection remain required.
