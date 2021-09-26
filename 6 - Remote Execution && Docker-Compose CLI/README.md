# Docker Remoting

Kao što smo pomenuli, Docker for Windows se sastoji od Docker Client-a (CLI) i Docker Engine-a (Server). Po _Default_-u, Docker Client (CLI) se konektuje na lokalni engine (Server). U ovoj ujedno poslednjoj celini, konektovaćemo se na remote engine iz lokalne MobaXTerm sesije i upravljati Docker Engine-om koji se nalazi negde na mreži.

Kako ne bismo morali da podižemo posebne mašine i radili instalaciju Docker-a, za ovu ekspediciju koristićemo jedan sajt koji se zove **Play With Docker**-

## Play With Docker
Postojanje sajta poput ovoga omogućava nam brzinsko testiranje. Link web sajta je [Play With Docker](https://labs.play-with-docker.com/). Potreban nam je otvoren nalog na DockerHub-u (mada je nekada radilo i bez istog), i preporučuje se korišćenje Chrome browser-a (Mozilla je umela da pravi probleme).

Nakon otvaranja linka, kliknemo na **Login**, nakon čega nam u padajućem meniju nudi da odaberemo user-a _docker_.
Pojavljuje se padajući meni u koji bi trebalo da unesemo kredencijale sa _DockerHub_-a i da kliknemo na dugme **Start**.

### Provision-ovanje mašina
Nakon uspešnog ulaska, pojavljuje se web strana sa tajmerom koji broji 4 sata. Nakon 4 sata, sav progres se briše, tako da je potrebno biti brz kada se koristi ovaj način testiranja. Klikom na **+ Add new instance** dobijamo novu Virtuelnu Mašinu na privremeno korišćenje, koja na sebi ima instaliran Docker Engine.

> Ono što zapravo dobijamo nije VM nego je u pitanju docker container koji u sebi sadrži Docker Engine (rekurzija bato!)

### Rad na provisionovanoj mašini
Da bi se uverili da na novoj mašini imamo instaliran Docker, dovoljno je da pozovemo komandu i validiramo njen output:
```bash
 $ docker info
```
Takođe komandama `docker container ps -a` i `docker image ls` uverimo se da je _Docker Engine_ bez ijednog kontejnera u trenutnoj konfiguraciji i bez ijednog image-a.

#### Kreiranje mreže
Kao što znamo, potrebno je da kreiramo mrežu "ibismreza" kako bi kontejneri koje kreiramo mogli međusobno da se prepoznaju po _hostname_-u.
Listamo mreže i vidimo postojanje 3 mreže/, i to - "bridge", "host" i "none":
```bash
 $ docker network ls
```
Zatim kreiramo "ibismreza"[bridge] tip mreže:
```bash
 $ docker network create -d bridge ibismreza
```


#### Pokretanje aplikacije na ovoj mašini
Za potrebe testiranja aplikacije na remote okruženju možemo pokrenuti 3 kontejnera (BackEnd, Middleware i FrontEnd) na dobijenoj mašini. Ono što ćemo uraditi jeste pokretanje sva tri kontejnera kroz jednu multiline komandu.
> **Napomena**: U ovoj komandi predstavljen je sažetak svih komandi koje smo do sada imali odnosno pokretanje finalnih verzija sva tri kontejnera. Umesto $USERNAME varijable koju smo sufiksovali u okviru imena kontejnera, koristićemo sufiks "-PWD" koji će da označava da radimo na Play With Docker mašini.

One-Liner komanda za pokretanje 3 kontejnera:
```bash
 $ docker container run -v podaci:/data/db -v konfiguracije:/data/configdb -d --name mongodb-PWD -p 27017:27017 --network ibismreza --hostname catsdb.ibis-solutions.rs dichtung/catalyzator-mongo-db:1.0.0 && \
 docker container run -d --name catsapi-PWD --hostname catsapi.ibis-solutions.rs --network ibismreza dichtung/catalyzator-api:1.0.0 && \
 docker container run -d --network ibismreza --name frontend-PWD -p 80:80 -p 5900:5900 dichtung/catalyzator-fe:1.0.0
```
Ukoliko je sve OK, pokrenuće se 3 procesa implicitnih povlačenja image-a a potom i proces podizanja kontejnera. Ovoga puta kreirali smo 3 kontejnera i to: `mongodb-PWD`, `catsapi-PWD` i `frontend-PWD` baš ovim redosledom. Ukoliko pogledamo komandu `docker container ps` trebalo bi da imamo 3 trčeća tj. _running_ container-a.

#### Testiranje
U okviru web interfejsa, iznad konzole, trebalo bi da se pojavi spisak svih otvorenih portova tj. portova mapiranih sa _Docker Machine_-om. Među njima, verovatno se nalaze (80/tcp, 5900/tcp i 27017/tcp). Kliknemo na **port 80** koji bi trebalo da nam otvori grafički interfejs.

Primetićemo da nemamo ni jednu mačku izlistanu u listi. U pitanju je loše konfigurisan NGiNX server koji ne ume lepo da zahtev :5900/api redirect-uje na middleware container. Ovde se nećemo baviti time, ali bitno je samo da vidimo da kontejnere i image možemo u roku od nekoliko sekundi podići na remote mašini.


### Docker Context i SSH konekcija.

Ukoliko želimo, na remote mašinu možemo se nakačiti i pomoću lokalnog CLI klijenta. To činimo kreiranjem tzv. **konteksta**. U okviru Play-With-Docker sajta, data nam je SSH adresa za povezivanje na remote način. Ona izgleda slično kao :
```text
ssh ip172-18-0-41-c58a7gnnjsv000evov20@direct.labs.play-with-docker.com
```

Kako bi se uspostavila uspešna konekcija, moramo generisati private/public RSA Key i konekciju ostvariti kroz Powershell sesiju.

#### Public key
Da bi konekcija uopše prošla, potrebno je kreirati private/public RSA key par. Pokreće se komanda:
```Powershell
 # U Powershell-u
 PS:> ssh-keygen.exe
```
I ostaviti sve po defaultu (samo Enter, Enter, Enter). Nakon toga konekcija će uspeti.

#### Postojeći konteksti
Iz Powershell-a pozovemo komandu koja će da izlista sve postojeće kontekste:
```Powershell
 PS:> docker context ls
```
Output:
```text
NAME                TYPE                DESCRIPTION                               DOCKER ENDPOINT                             KUBERNETES ENDPOINT   ORCHESTRATOR
default *           moby                Current DOCKER_HOST based configuration   npipe:////./pipe/docker_engine                                    swarm
desktop-linux       moby                                                          npipe:////./pipe/dockerDesktopLinuxEngine
```
U outputu komande vidimo da je trenutno korišćeni kontekst **default** obeležen sa asteriksom. Za potrebe remote kačenja na _Docker Engine_ koji se nalazi u okviru PWD sajta, napravićemo novi kontekst : `pwd-context` na sledeći način:
```Powershell
 PS:> docker context create pwd-context --docker "host=ssh://ip172-18-0-41-c58a7gnnjsv000evov20@direct.labs.play-with-docker.com"
```
Nakon čega bi trebalo da imamo novi kontekst

#### Korišćenje napravljenog konteksta
Promena konteksta vrši se:
```Powershell
 PS:> docker context use pwd-context
```
Sada možemo da izdajemo standardne komande kroz lokalnu instancu i da radimo na remote Docker Engine-u. Izlistaćemo sve napravljene kontejnere i videćemo da ih imamo 3 koji su sa prefiksom -PWD
