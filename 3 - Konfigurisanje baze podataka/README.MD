# Docker Storage i konfiguracija baze podataka

Kao što smo rekli u prethodnoj jedinici gde smo prošli osnove rada sa docker kontejnerima i image-ima, problem storage-a je veoma veoma veliki. Priroda kontejnera je tranzijentna, prolazna tzv. _ephemeral_ priroda, što znači da se kontejneri konstantno uništavaju i umesto njih prave se novi prema postojećim image-ima.

Spinning Up novog kontejnera nije vremenski skupa operacija, jer se na postojeći ReadOnly image dodaje novi Read/Write layer FS-a, pa je ova operacija često reda veličine nekoliko sekundi do nekoliko desetina sekundi (versus boot VM-a na Type I HyperVisoru koji ume da traje poduže).

Postavlja se pitanje perzistentnosti podataka i šta se dešava sa njima nakon što kontejner umre?

>## Eksperiment - samostalna vežba:

* **Korak 1:** Podići kontejner od nginx:latest image-a u _detached_ modu mapirati port 9090 spolja na kontejnerski port 80, nazvati kontejner "nginx-ime.prezime". _Hint_ koristiti environment varijablu $USERNAME 'nginx-$USERNAME' (Ako je username drugačiji i nije ime.prezime nego neki drugi, nema veze).

* **Korak 2:** Izlistati sve kontejnere i proveriti da li je naš "nginx-ime.prezime"" kontejner u trčećem tj. Running statusu

* **Korak 3:** koristeći `docker exec` pomoću Windows Powershell-a interaktivno ući u kontejner. U tekućem folderu (/ - root folder) napraviti tekstualni fajl .txt i u njega upisati proizvoljan teks. Zamislimo da je .txt fajl proizvod rada kontejnera (sačuvana varijabla ili neki podatak).
_Hint 2_: pravljenje fajla `$ echo "Ovo su neki međurezultati" > /rezultati.txt`
* **Korak 4:** `ls` komandom proveriti da li u root direktorijumu `/` imamo novi fajl koji se zove _rezultati.txt_. Ukoliko postoji izaći iz kontejnera.
* **Korak 5:** Stopirati i obrisati kontejner. Potom napraviti novi kontejner prema specifikaciji iz Koraka 1. Ponovo ući u kontejner prema specifikaciji iz Koraka 3. Proveriti da li postoje `rezultati.txt` ili ne? Da li je ovo ponašanje očekivano i zašto?
___

Kao što smo videli u vežbi, podaci se gube zajedno sa kontejnerima. Ukoliko želimo da podatke na određenoj lokaciji čuvamo, prvo što je potrebno uraditi jeste prilikom kreiranja image-a definisati `VOLUME`. Volume predstavlja lokaciju na kontejnerskom file systemu za koju će Docker Engine voditi računa da bude deljena između svih kontejner-a koji nastaju od tog image-a.

Drugim rečima, ukoliko naš image ima definisan `VOLUME` na određenoj lokaciji container FS-a, to znači da će docker na sebi svojstven način da "čuva" tj. perzistira podatke sa lokacije koja je naznačena u `VOLUME`-u.

`nginx:latest` image u svojoj definiciji nema definisane VOLUME, pa nam on u ovom slučaju nije zanimljiv, već ćemo se baviti sa MongoDB bazom podataka odnosno `mongo:5.0.2` image-om koji smo ranije skinuli sa DockerHub-a docker pull komandom.

Ukoliko uradimo inspekciju `mongo:5.0.2` image-a možemo da vidimo sledeće:
```bash
 $ docker image inspect mongo:5.0.2
```
Output (deo):
```text
"ContainerConfig": {
            "Hostname": "16bb1357c651",
            "Domainname": "",
            ...
            ...
            ...
            "Image": "sha256:62aca73e2c8f80b8d0d9c8817304dfc445ad6dea4696feca9021ff8a3914d68a",
            "Volumes": {
                "/data/configdb": {},
                "/data/db": {}
            },
            "WorkingDir": "",
            "Entrypoint": [
                "docker-entrypoint.sh"
            ],
            "OnBuild": null,
            "Labels": {}
        },

```

U delu `Volumes:` imamo definisana dva Volume-a:
* _/data/configdb_ - lokacija gde se perzistiraju konfiguracioni podaci
* _/data/db_ - lokacija gde se perzistiraju Database podaci
(Prema dokumentaciji na dockerhubu za mongo image [link](https://hub.docker.com/_/mongo))

Kada se pokrene ovaj image (tj. kada pravimo kontejner), Docker će automatski da kreira lokaciju na docker mašini, koja će biti deljena sa kontejnerom zarad čuvanja podataka. Načini na koji se kreiraju deljene lokacije se razlikuju od načina kako koristimo mašinu.

Mapiranje Volume-a možemo da vršimo na 3 načina:
* **Named volumes:** Imenovanje određene lokacije na Docker Machine-i pomoću simboličkog imena (preporučeni način). Docker Machine sama vodi računa o upravljanju tom lokacijom. Moguće je izlistati sve zapamćene simboličke lokacije (volumes-e) na docker mašini
* **Bind Mounts:** Zadavanje direktne lokacije na docker mašini. U ovom slučaju se podaci direktno mapiraju između kontejnera i mašine i docker ne upravlja tom lokacijom (podaci se mogu obrisati i izgubiti).
* **Bind Mount to Host OS**: Samo u slučaju WindowsOS-a kada DockerMachine nije isto što i HostOS. Tada, zadavanjem relativne ili apsolutne putanje u okviru komande podatke iz kontejnera direktno linkujemo sa podacima na HostOS-u. Ovaj način nije preporučljiv za produkcione sisteme jer je dosta spod, ali je u redu koristiti ga kada se radi development.

___
## Volumes demo

Prilikom pokretanja `mongo:5.0.2` image-a, Docker će svaki put kreirati novo mapiranje onoga što je sa kontejnerske strane obeleženo kao "VOLUME" i što treba da nadživi kontejner i lokacije na Docker Machine-i. Ova specifikacija mapiranja može se videti pomoću komande:

```bash
 # Izlistamo sva mapiranja koja postoje između kontejnera i docker machine
 $ docker volume ls
```

Ukoliko smo samo jednom pokretali `mongo:5.0.2` image, Docker bi u ovoj listi trebao da nam vrati 2 mapiranja. Jedno za `/data/configdb` u kontejneru i jedno za `/data/db` lokaciju. Na lokaciji /data/db su svi podaci koje upisujemo u bazu. Ukoliko smo pokretali 2 puta kontejner, trebalo bi da imamo 4 mapiranja tj. četiri rezultata, za 3 pokretanja kontejnera imaćemo 6 mapiranja itd...

Da bi imali smislene rezultate, obrišemo sva mapiranja komandom:
```bash
 # Trik kako da se obrišu svi volumes-i u jednoj liniji (grupna operacija)
 $ docker volume rm $(docker volume ls -q)
```
Potom pokrenemo jedan `mongo` container, mapiramo portove i nazovemo ga mongodb-$USERNAME
```bash
 $ docker container run -d -p 27017:27017 --name mongodb-$USERNAME mongo:5.0.2
```


Output komande `$ docker volume ls` bi sada trebao da izgleda npr.:
```text
DRIVER    VOLUME NAME
local     5f3cb982448cd6c960c4455f0d43264b8d730609cdbd07e8416f62723058d91d
local     f5cd2b258e273ade6b1339b914cdd19cf26b7c61b767c8bb9d57a5e4fb93f7e5
```
Sami po sebi ovi volume-i, izlistani na ovaj način ne daju nam mnogo informacija o tome šta je mapirano, gde je mapirano i ko je tražio mapiranje.

Tek nakon inspect-a, možemo da vidimo detaljnije šta se dešava u okviru jednog "volume"-a tj. mapiranja:

```bash
 # Iz nekog razloga docker me tera da prekucavam celo ime kad su Volumes u pitanju
 $ docker volume inspect 5f3cb982448cd6c960c4455f0d43264b8d730609cdbd07e8416f62723058d91d
```
```text
[
    {
        "CreatedAt": "2021-09-04T22:14:19Z",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/5f3cb982448cd6c960c4455f0d43264b8d730609cdbd07e8416f62723058d91d/_data",
        "Name": "5f3cb982448cd6c960c4455f0d43264b8d730609cdbd07e8416f62723058d91d",
        "Options": null,
        "Scope": "local"
    }
]
```
Kao što vidimo, docker je kreirao volume tj. mapiranje čiji je id: `5f3...` a čiji je **Mountpoint:** /var/lib/docker/volumes/5f3cb.../_data.

Ukolko uradimo inspekciju kontejner-a koji smo maločas pokrenuli:
```bash
 $ docker container inspect mongodb-$USERNAME
```
Deo output-a koji je bitan izgleda:
```text
"Mounts": [
            {
                "Type": "volume",
                "Name": "5f3cb982448cd6c960c4455f0d43264b8d730609cdbd07e8416f62723058d91d",
                "Source": "/var/lib/docker/volumes/5f3cb982448cd6c960c4455f0d43264b8d730609cdbd07e8416f62723058d91d/_data",
                "Destination": "/data/configdb",
                "Driver": "local",
                "Mode": "",
                "RW": true,
                "Propagation": ""
            },
            {
                "Type": "volume",
                "Name": "f5cd2b258e273ade6b1339b914cdd19cf26b7c61b767c8bb9d57a5e4fb93f7e5",
                "Source": "/var/lib/docker/volumes/f5cd2b258e273ade6b1339b914cdd19cf26b7c61b767c8bb9d57a5e4fb93f7e5/_data",
                "Destination": "/data/db",
                "Driver": "local",
                "Mode": "",
                "RW": true,
                "Propagation": ""
            }
        ]
```
Ovde vidimo da je za potrebe dva definisana volumes-a na image-u Docker sam napravio dve lokacije u okviru /var/lib/docker mašine. U ovim lokacijama je kreirao dva mapiranja koja imaju svoj random id i definisao je te lokacije.
>**PROBLEM:** ukoliko pokrenemo 20, 30, 50 puta ovaj kontejner to znači da će na docker mašini biti napravljenih 40, 60 odnosno 100 različitih foldera unutar /var/lib/docker/volumes direktorijuma i može doći do saturacije  docker mašine!

___
## Način 1 - Specificiranje lokacije na Docker Machine-i

Ukoliko želimo da specificiramo određenu lokaciju koju hoćemo da mapiramo sa container volume-om koristimo parametar `-v <source location>:<destination location>:access_specification` prilikom `docker container run` komande

```bash
 $ docker container run -v /usr/mydata:/data/db -v /usr/myconf:/data/configdb -d --name mycontainer -p 27018:27017 mongo:5.0.2
```
Ova logika u okviru kontejnera, kreira direktan mount i **ne kreira volumes definiciju mapiranja**. To se lako proverava komandom `docker volume ls`. Kreira se takozvani *bind mount*.

Tada se lokacija /usr/mydata na docker machine-i mapira na /data/db lokaciju u kontejneru. Takođe se lokacija /usr/myconf mapira na /data/configdb

> **VEOMA VAŽNO:** Ovo sve super radi dok se ne desi restart docker machine-a. Određene lokacije se nakon svakog restarta mašine brišu. Tako da je bitno imati to u vidu, jer je moguće izgubiti podatke na ovaj način.


### Vežba 2 - bind tip volumes-a
Ovde ćemo probati da razjasnimo šta se i kako se dešava prostom vežbom:

* **Korak 1:** Stopirati sve kontejnere i obrisati sve instance kontejnera sa sistema. Takođe obrisati sve docker volumes-e.
* **Korak 2:** Pokrenuti container "mycontainer" prema code snippetu priloženim iznad. Bind-uju se se oba volume-a (`db` i `configdb` folderi).
* **Korak 3:** Izlistati sve docker volumes-e (mapiranja). Proveriti da se nisu napravili novi volumes-i, odnosno da je lista nakon pokretanja kontejnera prazna.
* **Korak 4:** Otvoriti interaktivni PS shell i ući u kontejner. Na lokaciji /data/db napraviti novi .txt fajl i upisati nešto u njega. Izaći iz kontejnera i uništiti kontejner (stopirati i obrisati ga).
* **Korak 5:** Ponovo pokrenuti kontejner, i ponovo ući u njega. Proveriti da li na lokaciji /data/db postoji .txt fajl koji smo kreirali.
* **Korak 6:** Ponovo uništiti kontejner i restartovati Docker for Windows (desni klik u system tray-u)
* **Korak 7:** Treći i ujedno poslednji put kreirati kontejner. Ući u njega i proveriti da li postoji fajl na lokaciji /data/db. Zašto?

Kao što smo videli u prvom delu, kada smo izdali komandu `docker info`, jedan od parametara bio je i Docker Root Dir: /var/lib/docker. Ovaj direktorijum se perzistira u okviru WSL mašine dok se /usr nakon restarta docker-a gubi. Na primeru docker-a na native Linux mašini, /usr direktorijum može biti konstantan i nakon restarta. Tako da možemo doći u situaciju da se neki Linux docker developer našali sa nama i pošalje nam bind koji je perzistentan na native linux mašini, ali se gubi na Windows WSL-u.

>> Obrisati kontejner `mycontainer`.!

## Način 2 - Bind sa Host OS-om.

Kreiraćemo bind koji će spojiti lokaciju na Desktop-u i lokaciju unutar mongodb kontejnera. U okviru MobaXTerm shell-a uraditi sledeće:
```bash
 # Promeniti lokaciju na Desktop kao:
 $ cd ~/Desktop
 # Potom kreirati folder koji se zove ContainerData
 $ mkdir ContainerData
 # Ući ćemo u folder
 $ cd ContainerData
 # Potom napraviti dva nova sub-direktorijuma 'config' i 'data'
 $ mkdir config
 $ mkdir data
```
Proveriti da li se na Dekstopu napravio novi direktorijum 'ContainerData'. Otvoriti ga i iz address bar-a prekopirati apsolutnu putanju do ovog direktorijuma. Sačuvati je. U mom slučaju apsolutna putanja do direktorijuma je:
```text
C:\Users\nikola.zarkovic\Desktop\ContainerData
Putanje do respektivnih foldera 'config' i 'data' su:
C:\Users\nikola.zarkovic\Desktop\ContainerData\config
C:\Users\nikola.zarkovic\Desktop\ContainerData\data
```
Pokrenućemo novi kontejner ali ovoga puta umesto volumes-a koristićemo bind mount sa apsolutnom putanjom Windows OS-a do našeg foldera. Pokrenemo kontejner kao: **Ne kopirati komandu jer putanje bind-a nisu iste!!!**
```bash
 $ docker container run -v C:\\Users\\nikola.zarkovic\\Desktop\\ContainerData\\data:/data/db -v C:\\Users\\nikola.zarkovic\\Desktop\\ContainerData\\config:/data/configdb -d --name mycontainer -p 27018:27017 mongo:5.0.2
```
> Duple \\ su potrebne da bi se escape-ovao znak "\"

Prilikom pokretanja kontejnera pojavljuje se informacija da pokušavamo da Bind-ujemo Windows Host OS sa lokacijom na WSLv2 subsistemu i da takav način bind-ovanja može imati loše performanse. Ovakav način je sasvim OK za potrebe development-a.

Otvorimo datoteku ContainerData na Desktopu i uđemo u folder "data". Napravimo novi .txt fajl i nazovemo ga "01proba.txt". U njega upišemo proizvoljan tekst.

Pomoću Powershell sesije ulogujemo se u kontejner `mycontainer`
```Powershell
 PS:> docker exec -it mycontainer /bin/bash
 # U Kontejneru
 $ cd /data/db
 $ cat 01proba.txt
```
Vidimo da se u kontejneru direktno vidi novokreirani fajl 01proba.txt koji smo editovali na našem WindowsOS-u. Dodamo novu liniju u fajl '01proba.txt' kao:
```Powershell
 $ echo "\nOvo je novi red generisan unutar kontejnera" >> 01proba.txt
```
Otvorimo opet folder data na desktopu i proverimo fajl '01proba.txt'. Vidimo da je tu nova linija.  
Zatvorimo fajl, zatvorimo konekciju u okviru powershell-a i obrišemo kontejner kao i fajlove sa Desktop-a.

## Način 3 - Named volumes

Najbezbolniji način. Kreira se tzv. "named volume" na nivou dokera. To je čak i preporučeni način rada. Defnišemo mapiranje kao:

```bash
 $ docker container run -v podaci:/data/db -v konfiguracije:/data/configdb -d --name mycontainer -p 27018:27017 mongo:5.0.2
```
I na ovaj način Docker kreira dva docker volumes-a (što se može videti izlistavanjem `docker volume ls`). To su obično lokacije:
* _/var/lib/docker/volumes/**podaci**/_data_
* _/var/lib/docker/volumes/**konfiguracije**/_data_

Ove lokacije u okviru docker mašine perzistiraju čak i nakon restarta Docker Machine-a. Takođe, nije nam bitno ni da znamo lokaciju volume-a već samo njeno ime. Docker na Linux-u može imati totalno drugačiju lokaciju za volume koji se zove "podaci" od Docker for Windows-a.

___
## Setup baze:

### Prerequisites: Mreža
Proverimo da li postoji mreža koju smo kreirali nešto ranije (ibismreza), ukoliko ne postoji kreiramo je.
```bash
 $ docker network ls
```
ukoliko ne postoji:
```bash
 $ docker network create -d bridge ibismreza
```

## Setup
Obrisaćemo sve dosadašnje kontejnere i docker volumes-e i kreiraćemo jedan MongoDB kontejner koji je spreman da se okačimo pomoću MongoDBCompass klijenta i da se igramo sa podacima. Kontejner koji kreiramo je sledećeg formata:
* Ime Kontejnera: `mongodb-$USERNAME` (u konkretnom slučaju biće _mongodb-nikola.zarkovic_)
* Port koji mapiramo: `27017` tj. standardni MongoDB
* Hostname kontejnera: `catsdb.ibis-solutions.rs`
* Mreža koju koristimo: `ibismreza`
* Koristimo named volumes-e: `podaci` i `konfiguracije`

Kada sve sastavimo u jednu komandu
```bash
 $ docker container run -v podaci:/data/db -v konfiguracije:/data/configdb -d --name mongodb-$USERNAME -p 27017:27017 --network ibismreza --hostname catsdb.ibis-solutions.rs mongo:5.0.2
```

## MongoDBCompass

Kada se otvori MongoDBCompass app, moguće je uneti konekcioni string koji prosto glasi:
```text
mongodb://localhost:27017
```
Ili podatke unostiti u formatu forme (samo port i localhost kao hostname).

Popunjavanje baze podataka i rad sa MongoDB bazom nisu obuhvaćeni ovim markdown-om. Ono što ćemo svakako kreirati pomoću MongoDBCompass UI-a je sturkutra.

* DB: **zivotinje**
* Collection: **macke**

Testni Podaci:

| name        | type                | lives_left    |
| :---        |    :----:           |          ---: |
| Tom         | Smotana macka       | 4             |
| Fifi        | Gradska macka       | 7             |
| Cicko       | Seoska macka        | 4             |
| Mjaukalo    | Mlada macka         | 9             |

## Kreiranje Custom baznog image-a i Seed-ovanje baze

Izučiti Dockerfile i kreiranu .js skriptu. Za kreiranje custom image-a od _Dockerfile_-a koristimo komandu `docker build`. Potrebno je da naznačimo kako će se novonastali image "zvati" odnosno da tagujemo image. Pošto je konačni cilj da ovaj image publikujemo na DockerHub, potrebno je da ispratimo konvenciju i da "ime" prefiksujemo sa DockerHub userom koji je u mom slučaju `dichtung`. Ime image-a neka bude `catalyzator-mongo-db` a verzija `1.0.0`. Celokupni tag dat je u snipetu koda:
> VAŽNO! Komandu docker build moramo izvršiti iz foldera gde se nalazi Dockerfile

```bash
 # U folderu 3 - Konfigurisanje baze podataka
 $ docker build -t dichtung/catalyzator-mongo-db:1.0.0 .
```
Nakon uspešno završene `docker build` komande, izlistavanjem svih docker image-a sada dobijamo i novonastali image **dichtung/catalyzator-mongo-db:1.0.0** u listi svih image-a. Kod vas pretpostavljamo da je drugačiji username od mog (dichtung):
```text
REPOSITORY                      TAG       IMAGE ID       CREATED          SIZE
dichtung/catalyzator-mongo-db   1.0.0     724e4d32286b   34 seconds ago   684MB
nginx                           latest    ad4c705f24d3   2 weeks ago      133MB
mongo                           5.0.2     0bcbeb494bed   3 weeks ago      684MB
```

## Finaliziranje image-a i publikovanje na DockerHub:
Stopirati sve aktivne kontejnere, obrisati sve kontejnere i obrisati sve kreirane volumes-e.
```bash
 # Kontejneri brisanje:
 $ docker container stop $(docker container ps -q) && docker container rm $(docker container ps -aq)
 # Brisanje svih volumes-a
 $ docker volume rm $(docker volume ls -q)
```

Pokrenemo kontejner sa svim parametrima (mreža, hostname, port) definisanim ranije, sa tom razlikom da pokrećemo ručno pravljeni image:

```bash
 $ docker container run -v podaci:/data/db -v konfiguracije:/data/configdb -d --name mongodb-$USERNAME -p 27017:27017 --network ibismreza --hostname catsdb.ibis-solutions.rs dichtung/catalyzator-mongo-db:1.0.0
```

Testiramo novonastali kontejner tako što otvorimo MongoDBCompass klijenta i unesemo sledeće parametre konekcije:
* **hostname:** localhost
* **port:** 27017
* **authentication method:** username/password
* **username:** ibis
* **password:** ibis123
* **authentication database:** zivotinje

Pogledamo da li unapred u kolekciji "macke" postoje 4 unapred definisane macke koje nam služe kao testni set podataka

## Publikovanje na dockerhub
Kada smo se uverili da je sve u redu sa MongoDB bazom podataka, radimo publikaciju na DockerHub

Prvo je potrebno da smo ulogovani na DockerHub
```bash
 $ docker login -u <dockerhub username> -p <password>
```

Nakon uspešnog logovanja, izvršimo komandu:
> prefiks vašeg username-a ide u ime image-a (kod mene je dichtung). Ne kopirati!

```bash
 $ docker image push dichtung/catalyzator-mongo-db:1.0.0
```
**Podizanje fajlova na DockerHub može da potraje!!!*
Ulogovati se na DockerHub i proveriti postojanje repozitorijuma <username>/catalyzator-mongo-db:1.0.0
