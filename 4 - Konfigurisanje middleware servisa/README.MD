# Podešavanje middleware-a - NodeJS w/ ExpressJS RESTful API

U ovoj sekciji bavimo se podešavanjem middleware-a odnosno kreiranja RESTfull API-ja sa osnovnim CRUD(C-Create R-Read U-Update D-Delete) operacijama nad bazom podataka.

## NodeJS image - skidanje i pokretanje
Node image koji koristimo je oficijelni **node:14-alpine** image koji svlačimo sa DockerHub-a. Za razliku od nginx i mongodb image-a, NodeJS image je nešto drugačiji.

```bash
 $ docker image pull node:14-alpine
```
Kada se uverimo da smo skinuli image `$ docker image ls`. Pokušamo da zavrtimo NodeJS kontejner:
```bash
 $ docker container run -d --name moj-nodejs node:14-alpine
```
> Info: docker container run komanda bi radila i bez prethodnog image pull-a (prisetiti se implicitno i eksplicitno povlačenje image-a sa repozitorijuma)

Kada pogledamo sve dostupne kontejnere `$ docker container ps -a` vidimo da je moj-nodejs kontejner u Exited statusu:
```text
CONTAINER ID   IMAGE                                 COMMAND                  CREATED         STATUS                     PORTS                                           NAMES
c666a287c03d   node:14-alpine                        "docker-entrypoint.s…"   6 seconds ago   Exited (0) 4 seconds ago                                                   moj-nodejs

```
Inspect-ujemo ovaj kontejner i `node:14-alpine` image. Defaultni CMD koji se pokreće prilikom kreiranja kontejnera je `node` komanda. Pošto nismo ništa specificirali, ovaj kontejner se sam stopira odnosno pređe u Exited status. Ovaj tip kontejnera moramo samostalno da konfigurišemo kako bi se kontejner kontinuirano vrteo.

## Aplikativni kod
Sav potreban aplikativni kod nalazi se u direktorijumu `/CatsAPI` a u direktorijumu `/TestResources` nalaze se SoapUI testovi i potrebni .jar library-ji.

### Definisanje konekcije na bazu.
Zarad konekcije na bazu potrebne su nam sledeći parametri:

* _Username:_ "ibis" (definisali smo ga prilikom kreiranja baze)
* _Password:_ "ibis123"
* _Hostname:_ to će biti hostname kontejnera. Middleware (NodeJS) kontejner i bazni (mongodb) kontejner moraju "sedeti" na istoj mreži (ibismreza). Tada će hostname biti `catsdb.ibis-solutions.rs`
* _Port:_ port je definisan kao pristupni port MongoDB Bazi, definisan je na portu `27017`
* _Authentication DB:_ je baza koja je postavljena da bude auth baza za "ibis" user-a. Defaultno je podešena kao: `zivotinje`.

Svi ovi podaci čine konekcioni string nad bazom koji ima sledeći format:
```text
mongo://<username>:<password>@<hostname>:<port>/?authSource=<authBaza>
Odnosno u kontekstu realnih podataka
mongo://ibis:ibis123@catsdb.ibis-solutions.rs:27017/?authSource=zivotinje
```
Potrebno je potražiti odgovore na sledeća pitanja:
* _Kako dostaviti određene parametre u Container?_
Najlakši način jeste doturanje informacija kontejneru kroz Environment Variable.
* _Da li se isplati hardcode-ovati podatke u aplikativnom kodu?_
Ne, zato što se ne isplati pisati dve aplikacije sa različitim parametrima za prod i non-prod baze podataka.


### Environment Variables
Prilikom pokretanja kontejnera, veoma lako možemo dostaviti određene informacije u kontejner. Za određene kontejnere nekada je potrebno specificirati određene environment varijable kako bi kontejner mogao ispravno da radi (Domaći: pogledati DockerHub dokumentaciju za MySQL officijelni kontejner).

#### Environment Variables - doturanje kroz docker run komandu
Pokrenemo jedan nginx kontejner kao:
```bash
 $ docker container run -d --name kontejner1 -e USERNAME=PeraZdera01 --env PASSWORD=pera.car123 nginx
```
Ovde smo pomoću argumenta `-e` odnosno `--env` u kontejner ubacili dve environment varijable. Pomoću Powershell-a uđemo interaktivno u kontejner
```Powershell
 PS:> docker exec -it kontejner1 /bin/bash

 #Zahtevamo environment varijable:
 $ env
```
Output je:
```text
root@c2fee16ae925:/# env
HOSTNAME=c2fee16ae925
PWD=/
PKG_RELEASE=1~buster
HOME=/root
USERNAME=PeraZdera01
PASSWORD=pera.car123
NJS_VERSION=0.6.2
TERM=xterm
SHLVL=1
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
NGINX_VERSION=1.21.3
_=/usr/bin/env
```
Ovo je jedan od dva načina definisanja ENV varijabli. Drugi način jeste prilikom kreiranja image-a.

### Kreiranje Image-a.
U okviru MobaXTerm-a, tačnije home direktorijuma (~), kreiramo jedan prazan Dockerfile i otvorimo ga za editovanje
```bash
 $ touch ~/Dockerfile
 $ notepad.exe ~/Dockerfile
```
Kada se otvori, u Notepad kopiramo sledeći set komandi i sačuvamo fajl:
```text
FROM nginx:latest
ENV AUTHOR=NikolaZarkovic
ENV EMAIL=test@gmail.com
ENV PHONE=0641234567
ENV CITY=BELGRADE
ENV YEAR=2021
```
Zatim _build_-amo novi image koji ćemo nazvati "testimage" pomoću:
```bash
 $ docker image build -t testimage - < ~/Dockerfile
```
Ako je sve prošlo uspešno, komanda `docker image ls` bi trebalo da pokazuje postojanje `testimage:latest` image-a.
Obiršemo privremeni dockerfile
```bash
 $ rm ~/Dockerfile
```
Pokrenemo kontejner na osnovu `testimage:latest` image-a &rarr;
```bash
docker container run -d --name kontejner2 testimage
```
Iskoristimo interaktivni Powershell da uđemo i proverimo postojanje definisanih environment varijabli. Vrednosti ENV varijabli su:
```text
HOSTNAME=778060fd847d
PWD=/
YEAR=2021
CITY=BELGRADE
PKG_RELEASE=1~buster
HOME=/root
PHONE=0641234567
NJS_VERSION=0.6.2
TERM=xterm
SHLVL=1
EMAIL=test@gmail.com
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
NGINX_VERSION=1.21.3
AUTHOR=NikolaZarkovic
_=/usr/bin/env
```
Kao što vidimo sve environment varijable koje smo definisale u Dockerfile-u su u našem kontejneru.

### Override ENV-a

Ukoliko pokrenemo `kontejner3` od image-a `testimage:latest` i pritom specificiramo da je CITY varijabla umesto BELGRADE neka druga vrednost, izvršićemo tzv. override environment varijable sa novom vrednošću.
```bash
docker container run -d --name kontejner3 --env CITY=BEIJING testimage
```
Ako pogledamo u ENV entry-je kontejnera br. 3 vidimo da je sada CITY=BEIJING
```text
...
YEAR=2021
CITY=BEIJING
PKG_RELEASE=1~buster
HOME=/root
PHONE=0641234567
...
```
Ovaj mehanizam nam može poslužiti da konfigurišemo određene _Default_-e prilikom rada sa sistemom (defaul db username, default db password) a ukoliko je potreban override, prilikom pokretanja kontejnera ove vrednosti se mogu pregaziti. Tako recimo `hostname` baze možemo pregaziti u slučaju da je potrebno da se gađa neka druga baza.

### Konzumiranje ENV-a u aplikaciji
Bez detaljnog ulaska u kod koji se nalazi u okviru **app.js** fajla, sledeći snippet zadužen je za konzumiranje ENV varijabli:
```js
...
//default port if not specified as ENVIRONMENT variable to expose API
const port = process.env.APP_PORT || 5900;
// Database host, port, username, password and auth_db
const dbhost = process.env.DB_HOSTNAME || 'localhost';
const dbport = process.env.DB_PORT || '27017';
const dbusername = process.env.DB_USERNAME || 'ibis';
const dbpassword = process.env.DB_PASSWORD || 'somePassword';
const dbauth = process.env.DB_AUTH || 'zivotinje';
const connectionStringURI = `mongodb://${dbusername}:${dbpassword}@${dbhost}:${dbport}/?authSource=${dbauth}`;
const connectionOptions = {
  connectTimeoutMS: 2000,
  serverSelectionTimeoutMS: 2000
};
const mongoClient = new MongoClient(connectionStringURI, connectionOptions);
...
```
Sve vrednosti koje postoje u okviru ovog koda mogu se setovati u okviru definicije _Dockerfile_-a **osim DB_PASSWORD**. Čuvanje passworda u okviru Environment varijabli predstavlja veliki security issue i veliki nou-nou bilo kada, bilo kako i bilo gde! Zato možemo da koristimo mehanizam koji se zove: Docker Secrets

## Docker Secrets
Docker Secrets je mehanizam koji se koristi za injektovanje senzitivnih podataka u kontejner. Docker Secrets možemo da koristimo samo ukoliko koristimo _docker-compose_ tool ili _docker swarm_ orkestrator kontejnera. Ideja jeste da se na jednom mestu definiše tajni podatak, a da se posle po nekom simboličnom imenu referiramo na njega unutar kontejnera.

Za potrebe ovog LAB-a, mi ćemo Password koristiti kao ENV varijablu, jer bilo koja alternativa iziskuje mnogo vremena (korišćenje custom password vault-ova i slično).

## Finalizacija DockerFile-a
Finalizirani _Dockerfile_ nalazi se u /CatsAPI direktorijumu. Pre nego što napravimo naš image, valjalo bi obrisati kontejner1, kontejner2 i kontejner3 kao i testimage:latest image.

```bash
 $ docker container stop kontejner1 kontejner2 kontejner3 && docker container rm kontejner1 kontejner2 kontejner3
 $ docker image rm testimage:latest
```
Za kreiranje novog image-a moramo da "naciljamo" direktorijum u kojem se nalazi _Dockerfile_ tj. recept (/CatsAPI direktorijum). Radi konzistencije, image ćemo nazvati `dichtung/catalyzator-api:1.0.0` pa je celokupna komanda:

```bash
 # Moramo biti u CatsAPI folderu!!!!
 $ docker image build -t dichtung/catalyzator-api:1.0.0 .
```

## Testiranje

Ukoliko se naš image nalazi u listi image-a `docker image ls` možemo da ga testiramo:
> Ukoliko zaboravimo da pokrenemo testcontainer u istoj mreži kao i bazni kontejner, pretraga po hostname-u neće raditi i dobićemo grešku koja glasi
"Neuspešno povezivanje na bazu!
getaddrinfo ENOTFOUND catsdb.ibis-solutions.rs"

```bash
 $ docker container run -d --name testcontainer --network ibismreza -p 5900:5900 dichtung/catalyzator-api:1.0.0
```
Moramo se uveriti i da je naš `mongodb-$USERNAME` kontejner sa validnom MongoDB instancom aktivan. Ako nije, pokrenemo ga.

Endpointi koji su definisani ovim API-jem su:

| Endpoint                                | HTTP VERB | OPIS                                                                    |
|-----------------------------------------|-----------|-------------------------------------------------------------------------|
| http://localhost:5900/api/v1/cats      | GET       | Dohvata sve mačke iz inventory-ja i prikazuje ih kao parsirani JSON niz |
| http://localhost:5900/ap1/v1/cat/:name | GET       | Traži mačku po imenu :name u inventory-ju                               |
| http://localhost:5900/api/v1/cat/:name | DELETE    | Briše mačku iz Inventory-ja po imenu                                    |
| http://localhost:5900/api/v1/cat       | POST      | Ubacuje novu mačku u Inventory mačaka                                   |
| http://localhost:5900/api/v1/cat/:name | PUT       | Update-uje mačku u Inventory-ju koju pronalazi po imenu                 |

Otvorimo web browser i unesemo adresu: `http://localhost:5900/api/v1/cats`.
Ukoliko je sve lepo konfigurisano, output koji dobijamo je:
```JSON
[
    {
        "name": "Tom",
        "type": "Smotana macka",
        "lives_left": 4
    },
    {
        "name": "Fifi",
        "type": "Gradska macka",
        "lives_left": 7
    },
    {
        "name": "Cicko",
        "type": "Seoska macka",
        "lives_left": 4
    },
    {
        "name": "Mjaukalo",
        "type": "Mlada macka",
        "lives_left": 9
    }
]
```
Kada smo se uverili da iz NodeJS kontejnera možemo da pogodimo MongoDB kontejner i da nam sve lepo radi, potrebno je da ubijemo `testcontainer` a da potom pokrenemo jedan potpuni kontejner sa svim parametrima:
* _Network:_ ibismreza
* _Hostname:_ catsapi.ibis-solutions.rs
* _Container Name:_ catsapi-$USERNAME (i.e. catsapi-nikola.zarkovic)
* _Port Mapping:_ 5900/tcp spolja na kontejnerski port 5900/tcp
* _Image:_ dichtung/catalyzator-api:1.0.0
Svi parametri spojeni u jednu komandu glase:
```bash
 # stopiramo i ubijamo testcontainer
 $ docker container stop testcontainer && docker container rm testcontainer
 # podižemo novi kontejner (potpuni)
 $ docker container run -d --name catsapi-$USERNAME -p 5900:5900 --hostname catsapi.ibis-solutions.rs --network ibismreza dichtung/catalyzator-api:1.0.0
```
## Publikovanje Image-a na DockerHub
Kao i u slučaju _BackEnd_-a, publikovanje vršimo komandom:
```bash
 $ docker image push dichtung/catalyzator-api:1.0.0
```

## Retaging image-a

Ukoliko nam je mrsko da se na image svaki put referiramo kao `dichtung/catalyzator-api:1.0.0` jer nam je ime image-a predugačko i mrzi nas da kucamo, postoji i drugi način kako se ovo može "izbeći".

Prilikom kreiranja image-a `docker build -t ...` kao ime image-a stavimo neko kraće ime, npr. "myimage" ili nešto što će nam biti lakše da kucamo u procesu testiranja. Tada će docker engine kreirati `myimage:latest` imidž. Kada smo istestirali napravljeni image, možemo ga re-tagovat. Drugim rečima, možemo napraviti novi tag nad istim image-om pomoću komande:

```bash
 $ docker image tag <SOURCE_IMG>:TAG <DESTINATION_IMG>:TAG
 # Što u našem slučaju izgleda ovako:
 $ docker image tag myimage:latest dichtung/catalyzator-api:1.0.0
```
Nakon čega na standardni način možemo publikovati image na DockerHub ili neki drugi registar. Ovaj način koristićemo u okviru sledeće celine kada budemo konfigurisali frontend
