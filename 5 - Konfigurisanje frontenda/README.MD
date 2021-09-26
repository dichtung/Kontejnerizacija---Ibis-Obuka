# Podešavanje FrontEnd-a

Kao FrontEnd u slučaju naše aplikacije, koristimo HTML5/CSS3/JS(ES6) tehnologije. WebServer će biti **NGiNX** WebServer / Reverse Proxy koji u ovom slučaju koristimo kao Docker Image i koji smo pominjali do sada veoma često.

Dokumentacija za NGiNX: [doc](http://nginx.org/en/docs/)

## WebServer
Po _Default_-u, NGiNX služi tj. _serve_-uje web stranice (html) koje se nalaze na lokaciji `/usr/share/nginx/html/`. Stoga u našem _Dockerfile_-u imamo sledeće direktive (_Stanza_-u):
```Dockerfile
# Postavljamo radni direktorijum na /usr/share/nginx/html
WORKDIR /usr/share/nginx/html/
# Kopiramo index.html u radni direktorijum
COPY index.html .
# Kopiramo script.js u radni direktorijum
COPY script.js .
# Kopiramo style.css u radni direktorijum
COPY style.css .
# Pravimo direktorijum koji se zove "resources" i u njega kopiramo sve frontend resurse (slike, logoe, ikonice)
RUN mkdir resources
COPY resources/* ./resources
```

Kako podrazumevani NGiNX server koji koristimo kao bazni image: `FROM nginx:latest` u svojoj osnovi ima `EXPOSE 80` direktivu, nije potrebno da otvaramo ponovo port 80 (nasleđujemo konfiguraciju od baznog image-a).
>NAPOMENA!: Iako smo rekli da korišćenje :latest image-a nije najbolja ideja, ovde se ne bavimo verzijom image-a. Ovog puta ćemo da uradimo kako ne treba!

Prilikom pokretanja Image-a potrebno je premapirati port 80/tcp sa strane _Docker Machine_-a na port 80/tcp sa kontejnerske strane kako bi smo imali pristup resursima koji se nalaze u okviru `/usr/share/nginx/html` direktorijuma.

## HTTP Proxy

Što se proksiranja tiče, ideja jeste da frontend poziv API-ja funkcioniše tako što će iz browser-a biti pozvan API endpoint na istom hostu našeg NGiNX kontejnera, a port će biti port definisan portom na kojem se nalazi API middleware (Hardkodovaćemo port na `5900`).

> U okviru zvaničnog Docker NGiNX Image-a postoji tool koji može u određenom konfiguracionom fajlu koji je u foratu template-a da zameni placeholder vrednosti sa Environment varijablama (što je malo komplikovano za trenutnu demonstraciju)

Kao što se može videti u konfiguracionom fajlu koji se nalazi na lokaciji `./nginx/nginx-config.conf`, napravili smo posebnu konfiguraciju za proksiranje na takav način da će NGiNX server da osluškuje na portu `5900/tcp` dolazeće zahteve i pomoću `proxy_pass` direktive da poziva middleware koji smo definisali.

### Expose portova
U ovom slučaju sa kontejnerske strane, NGiNX proces će zbog `listen 5900` linije u okviru konfiguracionog fajla da otvori port 5900/tcp. Međutim ukoliko u našem slučaju ne definišemo `EXPOSE 5900` direktivu u _Dockerfile_-u, prilikom pokretanja kontejnera, listanja kontejnera i _inspect_-ovanja kontejnera nećemo videti da je _expose_-ovan port `5900/tcp` već samo port `80/tcp`. Zašto?!

> **Napomena1**: EXPOSE direktiva zapravo služi kao DOKUMENTACIJA o tome koji su portovi otvoreni. Ova direktiva ne stavlja portove na nivou kontejnera u LISTENING stanje, već to čine određeni proces(i) unutar kontejnera.

> **Napomena2**: Mapiranje portova između Docker Machine i kontejnera pomoću parametra -p XX:YY radiće i ukoliko ne specificiramo ni jedan EXPOSE u okviru Image-a koji koristimo. U našem slučaju moramo mapirati port 5900/tcp sa kontejnerske strane na određeni port ka Docker Machine-i.

> **Napomena3**: Ukoliko želimo da mapiramo port 5900/tcp &rarr; 5900/tcp prilikom pokretanja image-a verovatno ćemo dobiti grešku da je port sa strane Docker Machine 5900 već zauzet. Ukoliko se prisetimo, već smo prilikom testiranja jednom otvorili ovaj port.

Ukoliko želimo da iznova pokrenemo kontejner `catsapi-$USERNAME` koji sadrži middleware API, a da tom prilikom ne mapiramo port 5900/tcp na docker mašinu, tada komanda izgleda (**moramo ubiti postojeći kontejner zbog istog imena kontejnera**):
```bash
 # Stopiranje i ubijanje kontejnera
 $ docker container stop catsapi-$USERNAME && docker container rm catsapi-$USERNAME
 # Pokretanje nove instance kontejnera bez mapiranih portova na Docker Machine-u
 $ docker container run -d --name catsapi-$USERNAME --hostname catsapi.ibis-solutions.rs --network ibismreza dichtung/catalyzator-api:1.0.0
```

Ovoga puta ukoliko pokušamo da pokrenemo testove koje smo koristili za testiranje našeg API-ja, nećemo imati propusnost, jer sa strane _Docker Machine_ ne možemo da pristupimo kontejneru.

### Kreiranje Image-a

Ovoga puta prilikom pravljenja image-a nećemo specificirati puno ime prema _DockerHub_ specifikaciji već ćemo se koristiti skraćenom varijantom `test-fe`. Pozicioniramo se u folder **public** koji sadrži naš _Dockerfile_ i pozovemo komandu:
```bash
 $ docker image build -t test-fe .
```
Ova komanda će na lokalnom registru kreirati image `test-fe:latest` na osnovu našeg fajla. Pre nego što pokušamo da pokrenemo ovaj kontejner od image-a moramo obratiti pažnju na sledeće stvari:

* Prilikom pokretanja nginx servera, ukoliko nginx ne može da _resolve_-uje hostname _http://catsapi.ibis-solutions.rs_ specificiran u okviru konfiguracionog fajla, pokretanje NGiNX servisa biće neuspešno i kontejner se neće pokrenuti.
* Prvi preduslov je dakle da naš `catsapi-$USERNAME` middleware kontejner bude u stanju up and running
* Drugi preduslov je da se _FrontEnd_ komponenta tj. kontejner pokrene u okviru iste mreže `ibismreza` kako bi se uspešno resolve-ovao pomenuti hostname.

Kada smo ispunili oba preduslova, i kada osiguramo da postoje oba potrebna kontejnera (Bazni MongoDB i Middleware) u statusu UP, pokrećemo naš kontejner kao:
```bash
 $ docker container run -d --network ibismreza --name my-frontend -p 80:80 -p 5900:5900 test-fe
```
Kontejner nazivamo `my-frontend` i mapiramo oba porta `80/tcp` i `5900/tcp`. Image koji smo specificirali je `test-fe` odnosno `test-fe:latest`(_default_). Ukoliko je sve u redu, listanjem aktivnih kontejnera trebalo bi da imamo 3 aktivna kontejnera:
```text
CONTAINER ID   IMAGE                                 COMMAND                  CREATED              STATUS              PORTS                                                                          NAMES
7529ad6e03e9   test-fe                               "/docker-entrypoint.…"   About a minute ago   Up About a minute   0.0.0.0:80->80/tcp, :::80->80/tcp, 0.0.0.0:5900->5900/tcp, :::5900->5900/tcp   my-frontend
d294a053e9fe   dichtung/catalyzator-api:1.0.0        "docker-entrypoint.s…"   43 minutes ago       Up 20 minutes       5900/tcp                                                                       catsapi-nikola.zarkovic
46d139e17bc6   dichtung/catalyzator-mongo-db:1.0.0   "docker-entrypoint.s…"   41 hours ago         Up 3 minutes        0.0.0.0:27017->27017/tcp, :::27017->27017/tcp                                  mongodb-nikola.zarkovic
```

Otvoriti Web Browser i uneti adresu `http://localhost`. Ono što bi trebalo da vidimo jeste UI koji na grafički način prikazuje naše stanje u bazi mačaka odnosno u Cat Inventory-ju. Otvorimo takođe i aplikativnu klijentsku aplikaciju _MongoDBCompass_ i unesemo konekcione parametre:
* _Hostname:_ localhost
* _Port:_ 27017
* _Auth Method:_ username/password
* _Username:_ ibis
* _Password:_ ibis123
* _Auth DB:_ zivotinje

Kada se konektujemo odaberemo `zivotinje` DB a zatim `macke` Collection. Kroz UI aplikaciju u okviru browsera editovati nekoliko mačaka, dodati novu mačku i obrisati je. Videti da li se akcije u okviru UI-ja odražavaju na stanje u MongoDB bazi?


## Formalizacija Image-a i Kontejnera
Pošto ne želimo da nam se kontejner i image zovu "my-frontend" i "test-fe", respektivno, pristupićemo njihovoj formalizaciji.
Prvo ćemo stopirati i zaustaviti trčeći kontejner:
```bash
 $ docker container stop my-frontend && docker container rm my-frontend
```

Zatim je potrebno da preimenujemo tj. _Re-Tag_-ujemo image `test-fe:latest` u neko kršteno tj. smisleno ime, poput `dichtung/catalyzator-fe:1.0.0` (kao uvek, ime username-a se razlikuje). To činimo kao:
```bash
 $ docker image tag test-fe:latest dichtung/catalyzator-fe:1.0.0
```

Potom iznova pokrenemo image (ovoga puta sa novim imenom) i kontejneru damo smisleno ime kao npr. `frontend-$USERNAME`. To činimo komandom:
```bash
 $ docker container run -d --network ibismreza --name frontend-$USERNAME -p 80:80 -p 5900:5900 dichtung/catalyzator-fe:1.0.0
```

Uverimo se da imamo 3 running container-a a potom iznova testiramo UI na adresi `http://localhost`. Kada smo se uverili da sve lepo radi, jedino što nam preostaje jeste publikovanje kreiranog image-a na repozitorijum.

## Publikovanje na DockerHub
Publikovanje kao i do sada vršimo komandom:
```bash
 $ docker image push dichtung/catalyzator-fe:1.0.0
```
