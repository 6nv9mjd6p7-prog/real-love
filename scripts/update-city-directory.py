"""Refresh the server city fallback from GeoNames' CC BY 4.0 extracts."""
import datetime,hashlib,io,json,pathlib,urllib.request,zipfile
root=pathlib.Path(__file__).resolve().parents[1]
base='https://download.geonames.org/export/dump/'
def load(name):
    with urllib.request.urlopen(base+name,timeout=60) as response:return response.read()
def fold(text):
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFKD',text) if not unicodedata.combining(c)).lower()
def generate(files):
    regions={p[0]:p[1] for line in files['admin1CodesASCII.txt'].decode().splitlines() if len(p:=line.split('\t'))>=2}
    countries={p[0]:p[4] for line in files['countryInfo.txt'].decode().splitlines() if not line.startswith('#') and len(p:=line.split('\t'))>4}
    rows=[]
    with zipfile.ZipFile(io.BytesIO(files['cities15000.zip'])) as archive:
        for line in archive.read('cities15000.txt').decode().splitlines():
            p=line.split('\t')
            if len(p)<19 or p[6]!='P' or p[8] not in countries:continue
            name=p[1][:60];country=countries[p[8]][:80];region=regions.get(p[8]+'.'+p[10],country)[:80]
            lat,lon=round(float(p[4]),4),round(float(p[5]),4)
            if not name or not -90<=lat<=90 or not -180<=lon<=180:continue
            # Store display/ASCII names plus region and country codes; exclude addresses.
            context=fold(' '.join([name,p[2],region,country,p[8],p[10]]))
            rows.append([int(p[0]),name,region,country,lat,lon,int(p[14] or 0),fold(name),context])
    rows.sort(key=lambda r:(-r[6],r[0]))
    dest=root/'app/data';dest.mkdir(exist_ok=True)
    (dest/'cities.json').write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n')
    (dest/'cities-source.json').write_text(json.dumps({'source':'GeoNames','license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','generated':datetime.date.today().isoformat(),'coverage':'cities15000: cities over 15000 population and administrative capitals; not every town','records':len(rows),'files':{base+n:hashlib.sha256(data).hexdigest() for n,data in files.items()}},indent=2)+'\n')
    print('Generated',len(rows),'city records')
if __name__=='__main__':generate({name:load(name) for name in ['cities15000.zip','admin1CodesASCII.txt','countryInfo.txt']})
