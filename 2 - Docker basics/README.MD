# Kontejnerizacija - Docker Images and Containers

Ovde su pobrojane i prikazane neke Docker CLI komande za osnovni rad sa kontejnerima.

## Provera verzije i sistemskih podešavanja
### Provera verzije
Nakon uspešne instalacije komanda za proveru glasi:

```bash
 $ docker version
```

Output komande bi trebalo da izgleda (verzije se mogu razlikovati)

```text
Client:
 Cloud integration: 1.0.17
 Version:           20.10.7
 API version:       1.41
 Go version:        go1.16.4
 Git commit:        f0df350
 Built:             Wed Jun  2 12:00:56 2021
 OS/Arch:           windows/amd64
 Context:           default
 Experimental:      true

Server: Docker Engine - Community
 Engine:
  Version:          20.10.7
  API version:      1.41 (minimum version 1.12)
  Go version:       go1.13.15
  Git commit:       b0f5bc3
  Built:            Wed Jun  2 11:54:58 2021
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          1.4.6
  GitCommit:        d71fcd7d8303cbf684402823e425e9dd2e99285d
 runc:
  Version:          1.0.0-rc95
  GitCommit:        b9ee9c6314599f1b4a7f497e1f1f856fe433d3b7
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```
### Provera sistemskih podešavanja
```bash
 $ docker info
```
Output:
```text
Client:
 Context:    default
 Debug Mode: false
 Plugins:
  buildx: Build with BuildKit (Docker Inc., v0.6.1-docker)
  compose: Docker Compose (Docker Inc., v2.0.0-rc.1)
  scan: Docker Scan (Docker Inc., v0.8.0)

Server:
 Containers: 0
  Running: 0
  Paused: 0
  Stopped: 0
 Images: 2
 Server Version: 20.10.8
 Storage Driver: overlay2
  Backing Filesystem: extfs
  Supports d_type: true
  Native Overlay Diff: true
  userxattr: false
 Logging Driver: json-file
 Cgroup Driver: cgroupfs
 Cgroup Version: 1
 Plugins:
  Volume: local
  Network: bridge host ipvlan macvlan null overlay
  Log: awslogs fluentd gcplogs gelf journald json-file local logentries splunk syslog
 Swarm: inactive
 Runtimes: io.containerd.runtime.v1.linux runc io.containerd.runc.v2
 Default Runtime: runc
 Init Binary: docker-init
 containerd version: e25210fe30a0a703442421b0f60afac609f950a3
 runc version: v1.0.1-0-g4144b63
 init version: de40ad0
 Security Options:
  seccomp
   Profile: default
 Kernel Version: 5.4.72-microsoft-standard-WSL2
 Operating System: Docker Desktop
 OSType: linux
 Architecture: x86_64
 CPUs: 8
 Total Memory: 12.35GiB
 Name: docker-desktop
 ID: VQXN:7PZM:YGAT:2LJ3:Z7ZM:FRR2:QD5A:PGCF:52ES:X464:K2AK:OIL2
 Docker Root Dir: /var/lib/docker
 Debug Mode: false
 Registry: https://index.docker.io/v1/
 Labels:
 Experimental: false
 Insecure Registries:
  127.0.0.0/8
 Live Restore Enabled: false

WARNING: No blkio throttle.read_bps_device support
WARNING: No blkio throttle.write_bps_device support
WARNING: No blkio throttle.read_iops_device support
WARNING: No blkio throttle.write_iops_device support
```

Neke od zanimljivih informacija su:
* **Containers:** - broj svih kontejnera
* **Images:** - broj image-a na lokalnom repozitorijumu
* **Docker Root Dir: /var/lib/docker** - root direktorijum u okviru docker mašine
* **Registry:** - podrazumevani hostname image registry-ja kada se izostavi hostname deo.

# Image
Kao što smo pomenuli u okviru teorijskog dela, image je slika diska odnosno read-only stanje sistema. Image možemo povlačiti sa public/private image repozitorijuma ili ih praviti sami pomoću _Dockerfile_-a. Praksa prilikom rada sa Docker-om jeste da se za svaku upotrebu Docker-a pravi _Dockerfile_ koji će se koristiti u datoj aplikaciji. Povlačenja image-a vrši se na jedan od dva načina:

* ___Eksplicitno___ - zahtevanjem određenog image-a sa repository-ja
* ___Implicitno___ - prilikom pokretanja kontejnera specificiranjem image-a čija lokalna "kopija" ne postoji na lokalnom repozitorijumu.

## Eksplicitno povlačenje image-a
Eksplicitno povlačenje image-a sa repozitorijuma izvršava se tako što preciziramo koji image hoćemo da svučemo sa remote repozitorijuma. Kao što smo rekli, image ima svoj ``TAG`` koji je u formatu **HOSTNAME/NAME:TAG**. U slučaju izostavljanja ``HOSTNAME`` dela image TAG-a, Docker automatski defaultuje adresu na _docker.io/library_ gde se nalazi DockerHub javni repozitorijum. ``NAME`` deo odnosi se na ime repo-a, a ``:TAG`` deo se u najvećem broju slučajeva koristi za verzionisanje i version control. Docker konvencija je takva da, ukoliko izostavimo ``:TAG``, vrednost se defaultuje na _:latest_ što ćemo videti u sledećem primeru.

Pomoću **docker image pull** komande zahtevamo ``nginx`` image odnosno kopiranje u lokalni repozitorijum sa DockerHub-a.

```bash
 $ docker image pull nginx
```
Po staroj nomenklaturi moguće je izostaviti reč image pa da komanda glasi `docker pull nginx`, ali se navikavamo na potpune komande.
Ekvivalente komande bile bi:
```bash
 $ docker image pull nginx:latest
 //ili
 $ docker image pull docker.io/library/nginx:latest
```
Nakon ove komande, povlači se slika diska, layer po layer. Svaki Layer filesystem-a je definisan svojim unique ID-jem, tako da prilikom bilo kakve nadogradnje nad nekim layer-om, ne moramo da pravimo celu sliku sistema od početka, već od poslednjeg nepromenjenog stanja koje čuvamo u repozitorijumu. Zato je Docker toliko brz.

Proverom instaliranih image-a pozivom komande
```bash
$ docker image ls
```
dobijamo output gde su izlistani svi dostupni image-i:
```text
REPOSITORY   TAG       IMAGE ID       CREATED       SIZE
nginx        latest    dd34e67e3371   2 weeks ago   133MB
```
Kao što se vidi ``REPOSITORY`` je **ngigx** a ``TAG`` je **latest**
___

## Implicitno povlačenje image-a
Ukoliko specificiramo da želimo da pomoću `docker container run`(ili samo `docker run`) komande zavrtimo tj. pokrenemo kontejner bazirano na nekom image-u koji ne postoji na lokalnom docker repozitorijumu, docker engine će prvo pokušati da pronađe posmatrani image u lokalu, a potom i na default repozitorijumu (DockerHub) ukoliko nije drugačije specificirano.

Pre pokretanja komande **docker run** želimo da vidimo stanje image-a na lokalnoj docker mašini, tj. u lokalnoj kopiji repozitorijuma, te pozivamo komandu:

```bash
 $ docker image ls
```

Očekujemo output u kojem vidimo samo jedan image, i to nginx:

```text
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
nginx        latest    dd34e67e3371   2 weeks ago    133MB
```

U Konkretnom slučaju pokušavamo da pokrenemo kontejner u _detached_ modu (`-d` parametar) koji hoćemo da nazovemo pomoću ``--name`` opcije ``mongodb-baza``  i specificiramo image koji želimo da koristimo za pokretanje kontejnera. U našem slučaju, hoćemo da podignemo MongoDB NoSQL bazu u jednom kontejneru, tako da smo specificirali da je image ``mongo:5.0.2``. (Puno ime tag-a ovog image-a bilo bi ``docker.io/library/mongo:5.0.2`` ali u slučaju DockerHub-a možemo izostaviti hostname).

>**NAPOMENA: Uvek je dobra praksa specificirati verziju image-a koja se koristi, pogotovo u Produkcionom okruzenju, jer se :latest verzija moze drasticno promeniti i tako dovesti do gomile problema**

Prikaz layer-a je mnogo bolji kada se komanda izvrši putem Windows Powershell-a
```bash
 $ docker container run -d --name mongodb-baza mongo:5.0.2
```
Očekivani output je (sabijen):
```text
  Unable to find image 'mongo:5.0.2' locally
  5.0.2: Pulling from library/mongo
  35807b77a593: Pulling fs layer
  664b0ebdcc07: Pulling fs layer
  ...
  ...
  Status: Downloaded newer image for mongo:5.0.2
  5bdb1594e19d85226c6caaaef9ca34f5d2503235cd6e1cd9c12155429367ecbd
```

Output komande `docker image ls` sada bi trebalo da izgleda bogatije za jedan image (mongodb)
```text
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
mongo        5.0.2     0bcbeb494bed   14 hours ago   684MB
nginx        latest    dd34e67e3371   2 weeks ago    133MB
```

Detached mode `-d` nam nakon pokretanja kontejnera ne zauzima tekući terminal sa log fajlovima. U suprotnom bi morali da se raskačimo od kontejnerskog log file stream-a pomoću `CTRL+C`. Možete probati da vidite razliku sa i bez parametra `-d`.
___
# Kontejneri

Kontejneri su _runnable_ delovi koda, dependency-ja i library-ja enkapsulirani u jednu celinu, izolovani na operativnom sistemu i koriste (dele) kernel OS-a sa ostalim procesima.

## Listanje kontejnera
Poslednja komanda ``docker run -d --name mongodb-baza mongo:5.0.2`` koju smo pokrenuli je osim povlačenja ``mongo:5.0.2`` image-a pokrenula i kontejner. Listanje svih aktivnih (trčećih tj. running) kontejnera vršimo komandom:

```bash
 # Stara nomenklatura koja je i dalje aktivna
 $ docker ps
 # Po novoj nomenklaturi bi trebalo specificirati modul (container)
 $ docker container ps
```

Output komande je:

```text
CONTAINER ID   IMAGE         COMMAND                  CREATED          STATUS          PORTS       NAMES
f706a3f57a8b   mongo:5.0.2   "docker-entrypoint.s…"   10 minutes ago   Up 10 minutes   27017/tcp   mongodb-baza
```
Kao što se može videti, svaki kontejner ima svoje property-je koji ga karakterišu:

* `CONTANER ID` &rarr; Automatski generisan ID koji je dodeljen prilikom kreiranja kontejnera. Jedan od dva glavna načina pomoću kojeg se "obraćamo" kontejneru. Nije potrebno specificirati ceo ID, već prvih nekoliko karaktera prilikom odabira konkretnog kontejnera (npr. samo f7 ili f70)
* `IMAGE` &rarr; Image name i image tag od kojeg je nastao container
* `COMMAND` &rarr; tzv. entrypoint cmd koji predstavlja komandu koja se izvršava svakog puta kada pozovemo `docker run` komandu. u našem slučaju biva pozivana _docker-entrypoint.sh_ shell skripta koja setuje MongoDB unutar kontejnera.
* `STATUS` &rarr; status kontejnera. Kontejner tokom svog lifecycle-a prolazi kroz nekoliko stanja, i bitno je da znamo u kom se trenutno stanju nalazi.
* `NAMES` &rarr; ime tj. imena kontejnera pomoću kojih možemo da se "obraćamo" kontejneru. U našem slučaju specificirali smo jedno ime i to `mongodb-baza`

## Stopiranje i startovanje Running kontejnera

### Stopiranje
Stopiranje kontejnera koji je u statusu Running tj. UP stopiramo komandom:

```bash
 # stara nomenklatura
 $ docker stop [ CONTAINER_ID || CONTAINER_NAME ]
 # novija nomenklatura
 $ docker container stop [ CONTAINER_ID || CONTAINER_NAME ]
```
Dakle pokretanjem komande ``$ docker container stop f70`` spuštamo naš kontejner. Ako pokušamo da izlistamo sve kontejnere sa komandom `$ docker container ps` videćemo da nemamo nikakav output, odnosno dobijamo praznu listu kontejnera.

Ovde smo kao identifikator kontejnera koristili `CONTAINER ID` i to prvih nekoliko karaktera "f70". Pošto je to jedini kontejner, da smo napisali samo "f" kao identifikator, komanda bi bila uspešna, ali bi bio problem da je postojao još neki kontejner čiji `CONTAINER ID` počinje slovom "f".

### Listanje svih kontejnera (u svim stanjima)

Da izlistamo sve kontejnere (u svim stanjima) koristimo komandu:
```bash
 # Navikavamo se da koristimo "noviju" nomenklaturu
 $ docker container ps --all
 # takođe umesto "--all" postoji i shorthand parametar "-a"
```
```text
CONTAINER ID   IMAGE         COMMAND                  CREATED          STATUS                     PORTS     NAMES
f706a3f57a8b   mongo:5.0.2   "docker-entrypoint.s…"   35 minutes ago   Exited (0) 2 minutes ago             mongodb-baza
```

### Pokretanje stopiranog kontejnera

Startovanje stopiranog kontejnera vršimo komandom:
```bash
 # Koristićemo property CONTAINER NAME da se obratimo kontejneru
 $ docker container start mongodb-baza
```
U ovom slučaju moramo specificirati puno ime kontejnera.

## Brisanje kontejnera

Kontejneri su **ephemeral** tj. prolazne strukture po svojoj prirodi, i namenjeni su za takvo korišćenje. U praksi se gotovo nikada jedan kontejner ne podiže i spušta, već se uništava i prema specifikaciji (Dockerfile &rarr; Image &rarr; Container) pravi se novi kontejner. Management kontejnera ne dešava se ručno, već o tome vodi računa komponenta koja se zove "container orchestrator". Za više informacija, ključne reči su Kubernetes, Red Hat Open Shift i slično.

### Brisanje running container-a

Ukoliko je naš kontejner u statusu Running on se ne može direktno obrisati, već je potrebno prvo stopirati taj container `docker container stop {container id ili container name}` a potom pozvati komandu:
```sh
 $ docker container rm [ CONTAINER_ID || CONTAINER_NAME ]
```
Ukoliko hoćemo da obrišemo running container, možemo da iskoristimo i flag `-f` odnosno `--force` ali **moramo imati u vidu da se ovaj kontejner onda ubija pomoću `SIGKILL` signala, što nije gracefull zatvaranje**

### Fini trik za grupnu operaciju
Ukoliko imamo više kontejnera koji su u running stanju ili su spušteni, specificiranjem `-q` tzv. _quiet_ parametra ne dobijamo celu tabelu prilikom pozivanja ls i ps komandi za listanje, već samo niz CONTAINER ID-jeva odnosno IMAGE ID-jeva. Tada jednolinijske (One-Liner) komande izgledaju:

Za stopiranje **više** aktivnih kontejnera:
```bash
 $ docker container stop b44asc e4435 b43242 f98137
 # gde su argumenti 4 početna container ID-ja
```

Za stopiranje **svih** aktivnih (Running) kontejnera:

```bash
 $ docker container stop $(docker container ps -q)
```

Za brisanje svih kontejnera (imati u vidu da pretpostavljamo da su svi stopirani)

```bash
 $ docker container rm $(docker container ps -a -q)
 # Parametar -aq znači isto što i -a -q
```
___
## Interakcija sa kontejnerom i "ulaz u kontejner"
Ulazak u kontejner se, kao i reusing kontejnera ne preporučuje gotovo nikada osim eventualno u development fazi, ukoliko nas baš nužda natera. U konkretnom primeru MobaXTerm često ume da greši tako da za potrebe ulaska u kontejner možemo da koristimo Windows Powershell.

Napravimo novi kontejner od nginx:latest image-a koji smo skinuli u prethodnoj sekciji. Nazovemo ga kreativno `kontejner1`. Kasnije ćemo ući u ovaj kontejner
```powershell
 PS:> docker container run -d --name kontejner1 nginx
```

### Interakcija prilikom pokretanja kontejnera
Ukoliko prilikom kreiranja kontejnera (`docker run` komanda) želimo da izvršimo neki task, komandu možemo da specificiramo odmah nakon imena image-a. U ovom konkretnom slučaju želimo da isprintamo pozdravnu poruku i ime kontejnera tj. HOSTNAME property iz ENV-a.

Da bismo videli pozdravnu poruku, ne smemo koristiti `-d` detached mode. Kontejner nazovemo _kontjener2_

```powershell
 PS:> docker container run --name kontejner2 nginx /bin/bash -c "echo Hello from the inside of the container with hostname: `$HOSTNAME"

 Hello from the inside of the container with hostname: 56d56c4afe2a
```

>**BITNO:** Na ovaj način _override_-ujemo defaultno ponašanje kontejnera, tako da je on umesto defaultne komande koja pokreće nginx server, ispisao pozdravnu poruku i nakon toga zatvorio tj. stopirao kontejner. Videćemo da imamo dva kontejnera, jedan je Up and running (kontejner1) a drugi je Existed (kontejner2).


### Interaktivni shell
Ostvarivanje interakcije sa kontejnerom (running) vrši se pomoću `docker exec` komande. Za ulazak u kontejner koristimo sledeću komandu:

```powershell
 PS:> docker exec -i -t kontejner1 /bin/bash
```
Dobijamo pristup container _shell_-u
```bash
# Prikazujemo trenutnog user-a
root@6f3c80b194d8:/$ whoami
root
# Prikazujemo hostname
root@6f3c80b194d8:/$ echo $HOSTNAME
6f3c80b194d8
# Prikazujemo current working direktorijum (root dir)
root@6f3c80b194d8:/$ pwd
/
# Prikazujemo release OS-a
root@6f3c80b194d8:/$ cat /etc/*release
PRETTY_NAME="Debian GNU/Linux 10 (buster)"
NAME="Debian GNU/Linux"
VERSION_ID="10"
VERSION="10 (buster)"
VERSION_CODENAME=buster
ID=debian
HOME_URL="https://www.debian.org/"
SUPPORT_URL="https://www.debian.org/support"
BUG_REPORT_URL="https://bugs.debian.org/"
#Listanje svih fajlova i foldera u lističnom human readable formatu
root@6f3c80b194d8:/$ ls -alh
total 88K
drwxr-xr-x   1 root root 4.0K Sep  4 13:16 .
drwxr-xr-x   1 root root 4.0K Sep  4 13:16 ..
-rwxr-xr-x   1 root root    0 Sep  4 13:16 .dockerenv
drwxr-xr-x   2 root root 4.0K Sep  2 00:00 bin
drwxr-xr-x   2 root root 4.0K Jun 13 10:30 boot
drwxr-xr-x   5 root root  340 Sep  4 13:16 dev
drwxr-xr-x   1 root root 4.0K Sep  3 07:40 docker-entrypoint.d
-rwxrwxr-x   1 root root 1.2K Sep  3 07:39 docker-entrypoint.sh
drwxr-xr-x   1 root root 4.0K Sep  4 13:16 etc
drwxr-xr-x   2 root root 4.0K Jun 13 10:30 home
drwxr-xr-x   1 root root 4.0K Sep  3 07:40 lib
drwxr-xr-x   2 root root 4.0K Sep  2 00:00 lib64
drwxr-xr-x   2 root root 4.0K Sep  2 00:00 media
drwxr-xr-x   2 root root 4.0K Sep  2 00:00 mnt
drwxr-xr-x   2 root root 4.0K Sep  2 00:00 opt
dr-xr-xr-x 183 root root    0 Sep  4 13:16 proc
drwx------   2 root root 4.0K Sep  2 00:00 root
drwxr-xr-x   1 root root 4.0K Sep  4 13:16 run
drwxr-xr-x   2 root root 4.0K Sep  2 00:00 sbin
drwxr-xr-x   2 root root 4.0K Sep  2 00:00 srv
dr-xr-xr-x  11 root root    0 Sep  4 13:16 sys
drwxrwxrwt   1 root root 4.0K Sep  3 07:40 tmp
drwxr-xr-x   1 root root 4.0K Sep  2 00:00 usr
drwxr-xr-x   1 root root 4.0K Sep  2 00:00 var
```

Ovde vidimo da unutar kontejner-a, možemo da se ponašamo kao da smo ušli u virtuelnu mašinu na kojoj je instaliran nginx. Postavlja se pitanje kako da pristupimo resursima koji nam nudi kontejner, a da ne moramo da ulazimo pomoću interaktivnog shell-a.

___
## Networking i Storage
Networking i storage su od samog početka kontejnerizacije najveći problemi sa kojima se suočavamo. Postoje standardi i standardizovani načini kako radimo sa ove dve celine.

### Networking
Kontejneri se mogu odvajati u određene mreže (_Networks_) i tako možemo da postignemo da određeni kontejneri komuniciraju samo sa određenim kontejnerima. Međutim, postavlja se pitanje "šta ako neki kontejner sadrži resurse koje je potrebno da prikažemo krajnjem korisniku". Šta ako hoćemo da pristupimo resursima unutar kontejnera spolja.

#### Port forwarding / port exposing
Prilikom kreiranja image-a, svaka aplikacija koja se utilizuje preko mreže obično sluša na nekom od portova. Primera radi, OracleDB je po defaultu konfigurisan da radi na portu `:1521`. MongoDB koristi port `:27017`. MySQL baza koristi port `:3306` HTTP protokol je definisan na portu `:80`. HTTPS protokol na portu `:443` ili `:9443`. Naravno, da su ovi portovi podložni promenama u procesu konfiguracije aplikacije.

Da bi neka aplikacija uopšte mogla da se vidi spolja, potrebno je da u okviru virtuelnog adaptera i virtuelne mreže njen željeni port bude u `LISTENING` stanju. Kod docker kontejnera se to postiže prilikom kreiranja Image-a.

Direktiva `EXPOSE` otvara port i stavlja ga u listening stanje. Ukoliko za neki od image-a ne znamo koji su port-ovi expose-ovani sa strane kontejnera možemo to videti na sledeći način.

##### Inspect Image komanda
Komanda `docker image inspect <IMAGE NAME or IMAGE ID>` daje nam sve informacije o image-u.

```bash
 $ docker image inspect nginx
```

Dobijamo output: (sažet)
```text
...
"ContainerConfig": {
            "Hostname": "367d32086ac1",
            "Domainname": "",
            "User": "",
            "AttachStdin": false,
            "AttachStdout": false,
            "AttachStderr": false,
            "ExposedPorts": {
                "80/tcp": {}
            },
            "Tty": false,
            "OpenStdin": false,
            "StdinOnce": false,
            "Env": [
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                "NGINX_VERSION=1.21.1",
                "NJS_VERSION=0.6.1",
                "PKG_RELEASE=1~buster"
            ],
            "Cmd": [
                "/bin/sh",
                "-c",
                "#(nop) ",
                "CMD [\"nginx\" \"-g\" \"daemon off;\"]"
            ],

...
```
Vidimo u delu ContainerConfig: objekat ExposedPorts: koji ima vrednost **80/tcp**. To znači da će nginx servis da osluškuje sa strane kontejnera na portu :80 dolazeće http zahteve.

Obratiti pažnju na "Cmd:" property. Šta se dešava kada prilikom pokretanja image-a specificiramo komandu kao što je bila "echo hello from the container"?

#### Docker image history

Komanda:
```bash
 $ docker image history nginx
```
Daje nam output o svim slojevima tj. lejerima image-a, a nekde su čak prisutne i Dockerfile direktive koje su korišćene za kreiranje tog image-a. Direktive se često u literaturi nazivaju i **__Stanza__**-e. Jedna od njih je `EXPOSE` stanza koja sa strane kontejnera expose-uje port.

Output history komande:
```text
IMAGE          CREATED        CREATED BY                                      SIZE      COMMENT
822b7ec2aaf2   37 hours ago   /bin/sh -c #(nop)  CMD ["nginx" "-g" "daemon…   0B
<missing>      37 hours ago   /bin/sh -c #(nop)  STOPSIGNAL SIGQUIT           0B
<missing>      37 hours ago   /bin/sh -c #(nop)  EXPOSE 80                    0B
<missing>      37 hours ago   /bin/sh -c #(nop)  ENTRYPOINT ["/docker-entr…   0B
<missing>      37 hours ago   /bin/sh -c #(nop) COPY file:09a214a3e07c919a…   4.61kB
<missing>      37 hours ago   /bin/sh -c #(nop) COPY file:0fd5fca330dcd6a7…   1.04kB
<missing>      37 hours ago   /bin/sh -c #(nop) COPY file:0b866ff3fc1ef5b0…   1.96kB
<missing>      37 hours ago   /bin/sh -c #(nop) COPY file:65504f71f5855ca0…   1.2kB
<missing>      37 hours ago   /bin/sh -c set -x     && addgroup --system -…   63.9MB
<missing>      37 hours ago   /bin/sh -c #(nop)  ENV PKG_RELEASE=1~buster     0B
<missing>      37 hours ago   /bin/sh -c #(nop)  ENV NJS_VERSION=0.6.1        0B
<missing>      37 hours ago   /bin/sh -c #(nop)  ENV NGINX_VERSION=1.21.1     0B
<missing>      37 hours ago   /bin/sh -c #(nop)  LABEL maintainer=NGINX Do…   0B
<missing>      43 hours ago   /bin/sh -c #(nop)  CMD ["bash"]                 0B
<missing>      43 hours ago   /bin/sh -c #(nop) ADD file:4ff85d9f6aa246746…   69.3MB

```

##### Listanje pokrenutih kontejnera

Ukoliko opet pogledamo output komande ```docker container ps``` iz prethodnog slučaja gde smo imali pokrenut **kontejner1** nginx kontejner videćemo smo sledeći output:
```text
CONTAINER ID   IMAGE         COMMAND                  CREATED          STATUS          PORTS       NAMES
6f3c80b194d8   nginx         "docker-entrypoint.s…"   10 minutes ago   Up 10 minutes   80/tcp      kontejner1
```
Ovde je evidentno, u koloni **PORTS** da je expose-ovani port **80/tcp** što je defaultni port za HTTP saobraćaj. Ukoliko pokrenemo container sa mongo:5.0.2 verzijom, videćemo da se u `PORTS` koloni nalazi port **27017/tcp**.

U ovom trenutku bi trebalo da imamo trenutni trčeći kontejner "kontejner1" koji je podigao nginx server i expose-ovao ga na portu 80 (_defaultni HTTP port_). Otvorimo powershell i uđemo u ovaj kontejner, kao:

```Powershell
 PS:> docker exec -i -t kontejner1 /bin/bash
```
Potom kada dobijemo root pristup kontejneru:
```bash
# Unutar kontejner1 kontejnera izvršavamo  komande
root@6f3c80b194d8:/$  curl localhost:80
```
Dobijamo default NGINX pozdravnu poruku tj. html webpage:
```html
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

Postavlja se pitanje kako da pristupimo ovom resursu (web stranici) spolja?

#### Port mapping

Ukoliko hoćemo da otvorimo mapiranje između docker mašine i kontejnera prilikom pokretanja kontejnera `docker run` komanda, specificiramo parametar `-p <source port>:<destination port>` gde je source port port koji dedikujemo na lokalnoj doker mašini dok je destination port zapravo port u kontejneru.

Ilustracija port mappinga:
<img src="https://imgur.com/o04ZKAS.png"/>


Jedino ima smisla da destination port uvek bude onaj koji je _expose_-ovan. Namapiraćemo port 8080 na docker mašini na port 80 koji je expoes-ovan u nginx kontejneru.

Prvo zaustavimo trčeće kontejnere:
```bash
 $ docker container stop kontejner1
```
Potom ga brišemo:
```bash
 $ docker container rm kontejner1
```
Sada startujemo kontejner iznova ali ovoga puta sa `-p 8080:80` parametrom:
```bash
 $ docker container run -p 8080:80 -d --name kontejner1 nginx
```
Otvorimo Web Browser i ukucamo adresu `localhost:8080` i ukoliko je sve u redu, trebalo bi da vidimo pozdravnu poruku.

> **BITNO:** Port expose sa strane kontejnera radi se u fazi Image Build-a, dakle specificira se u okviru Dockerfile-a tj. recepta. Aktuelno mapiranje dešava se u fazi pokretanja kontejnera. Nije moguće predefinisati image tako da se portovi spolja namapiraju. Postoje načini kako se to rešava elegantno i brzo, ali je to tema za neki drugi put. Za više informacija videti pod "docker-compose".

#### Stopiranje i brisanje svih kontejnera

U ovom trenutku možemo da stopiramo sve kontejnere i da ih obrišemo. Za tu potrebu možemo koristiti shorthand operator `&&` i spojiti dve komande koje smo naučili ranije u _one-liner_ komandu:

```bash
 # Stopiraj sve aktivne kontejnere i ukoliko je komanda uspešna
 # obriši sve kontjenere. Operator \ je delimiter za multiline komandu
 $ docker container stop $(docker container ps -q) && \
 docker container rm $(docker container ps -a -q)
```
izvršimo komandu `docker container ps -a` da se uverimo da smo sve kontejnere obrisali, i takođe izvršimo komandu `docker image ls` da se uverimo da imamo samo dva image-a
* `nginx:latest`
* `mongo:5.0.2`

### Hostname kontejnera

Primetili smo da, prilikom rada sa kontejnerima, svaki od kontejnera može da ima svoje ime koje definišemo sa `--name` parametrom. Kada smo interaktivno ulazili u kontejnere, videli smo da je njihov hostname (komanda `echo $HOSTNAME`) bio identičan kao i `CONTAINER ID` vrednost.

Parametar `--hostname` možemo koristiti za definisanje hostname-a unutar kontejnera.

Napravimo ponovo dva kontejnera, i dodamo im novi parametar:
```bash
 $ docker container run -d --name kontejner1 --hostname kontejner1.ibis-solutions.rs nginx
 $ docker container run -d --name kontejner2 --hostname kontejner2.ibis-solutions.rs nginx
```

Otvorimo dve nove Powershell sesije i u svakoj od sesija ulogujemo se u odgovarajući kontejner:
```Powershell
 PS1:> docker container exec -it kontejner1 /bin/bash
```
```Powershell
 PS2:> docker container exec -it kontejner2 /bin/bash
```
Kada smo ušli u oba kontejnera, pokušajmo da isprintamo $HOSTNAME environment varijablu pomoću `echo $HOSTNAME` komande. Dobijamo da su hostname kontejnera **kontejner1.ibis-solutions.rs** i **kontejner2.ibis-solutions.rs** respektivno.

Minimalistička verzija linux-a u okviru kontejnera (Debian 10 Buster (slim)) ne sadrži alate za testiranje mreže kao što su ping, telnet ...

U oba kontejnera izvršiti sledeću komandu kako bi smo instalirali alate (ping alat)

```bash
 $ apt-get update && apt-get install -y iputils-ping
```

Nakon uspešne instalacije iz kontejnera broj 1 pokušajmo da pingujemo adresu "kontejner2.ibis-solutions.rs". Takođe uradimo iz kontejnera2 sa adresom "kontejner1.ibis-solutions.rs". **Vidimo da ping nije moguć? Zašto?**

## Networks
Docker mrežni drajver automatski vodi računa o mrežnim konfiguracijama. Ono što je nama konkretno bitno u ovom trenutku jeste rad sa mrežama. Ukoliko za svaki od kontejnera (kontejner1 i kontejner 2) pozovemo komandu:
```bash
 $ docker container inspect kontejner1 #ili kontejner2
```
Videćemo u outputu deo koji se tiče mrežnih konfiguracija.
```text
...
"IPv6Gateway": "",
"MacAddress": "02:42:ac:11:00:02",
"Networks": {
    "bridge": {
        "IPAMConfig": null,
        "Links": null,
        "Aliases": null,
        "NetworkID": "318206c9bb1361033e6259c8610e50b0a277c20dfc5f1a55496b250287e282e1",
        "EndpointID": "390c00f0998d08f70d96b2ee81bc3e2bb70138b4251179117c3a070e2e49dfb2",
        "Gateway": "172.17.0.1",
        "IPAddress": "172.17.0.2",
        "IPPrefixLen": 16,
        "IPv6Gateway": "",
        "GlobalIPv6Address": "",
        "GlobalIPv6PrefixLen": 0,
        "MacAddress": "02:42:ac:11:00:02",
        "DriverOpts": null
    }
}
...
```
U delu Networks vidimo da je mreža kojoj pripada ovaj kontejner  **bridge** (gde je "bridge" ime mreže!!!).

Ukoliko izlistamo sve mreže pomoću komande:
```bash
 $ docker network ls
```
Dobijamo spisak od 3 dostupne mreže:
```text
NETWORK ID     NAME      DRIVER    SCOPE
318206c9bb13   bridge    bridge    local
987fc579b898   host      host      local
233898dc6509   none      null      local
```

kada kreiramo novi kontejner i ne specificiramo mrežu kojoj će taj kontejner pripadati, on automatski biva učlanjen u "bridge" mrežu.
> Veoma bitno: tipovi mrežnih drajvera koji se koriste na Docker mašini su: bridge, host, overlay, none, macvlan ili custom mrežni drajver koji sami možemo da razvijamo. U ovom konkretnom slučaju mreža se zove isto kao i tip mrežnog drajvera.

Postojeća praksa je takva da je najbolje kontejnere odvojiti u zasebnu mrežu (_Network_) baš iz razloga security-ja i konektivnosti.

### Zašto pingovanje dva kontejnera u istoj ("bridge") mreži ne radi!

Prema dokumentaciji na link-u [doc](https://docs.docker.com/config/containers/container-networking/), kontejneri u _default_-noj "bridge" mreži, postavljanjem `--hostname` parametra dobijaju hostname samo:
* U lokalnom(kontejnerskom) /etc/hosts fajlu
* U lokalnom(kontejnerskom) /etc/resolv.conf fajlu
* U imenu PS1 varijable koja se prikazuje u shell-u i shell prompt-u-

Ovako definisan hostname ne pomaže nam mnogo. Prilikom definisanja kontejnera (run komanda) moguće je definisati alijase koji će se naći u okviru /etc/hosts fajlova, pa je moguće hostname prvog kontejnera definisati u /etc/hosts fajlu drugog kontejnera i obratno, ali to nije preporučljivo.

### Kreiranje nove mreže

Ukoliko kreiramo novu mrežu i nazovemo je, npr. "ibismreza" i definišemo da je mrežni drajver _bridge_ tipa, Docker Machine će za datu mrežu automatski generisati i jedan dedikovani DNS server. Tada će svi kontejneri koji se podižu sa određenim `--hostname` parametrom svoju ip-adresu i hostname prijaviti tom dedikovanom DNS serveru.

Komandom
```bash
 $ docker network create -d bridge ibismreza
```
Definišemo novu "ibismreza" mrežu u okviru kontejnera. Ukoliko izlistamo dostupne mreže `docker network ls` videćemo novu mrežu čiji je mrežni drajver bridge tipa.

Kreirajmo sada dva nova kontejnera ("kontejner3" i "kontejner4") i podesimo ih da budu učlanjeni u ibismreza mrežu.

```bash
 $ docker container run -d --name kontejner3 --network ibismreza --hostname kontejner3.ibis-solutions.rs nginx
 $ docker container run -d --name kontejner4 --network ibismreza --hostname kontejner4.ibis-solutions.rs nginx
```
Ukoliko pokušamo da izvršimo `docker inspect kontejner3` komandu, u delu Networks videćemo da ova dva kontejnera (kontejner3 i kontejner4) zaista pripadaju ibismreza mreži.

Otvorimo dva nova Powershell prozora (tako da ih ukupno imamo 4, za svaki od kontejnera) i ulogujemo se u kontejnere 3 i 4. `docker exec -it kontejner3 /bin/bash` i `docker exec -it kontejner4 /bin/bash` komande.

U svakom od prozora za kontejner3 i kontejner4 instaliramo ping mrežni alat pomoću komande:
```bash
 $ apt-get update && apt-get install -y iputils-ping
```
Nakon uspešne instalacije pokušamo da iz kontejnera3 pingujemo hostname kontejnera4 tj. _kontejner4.ibis-solutions.rs_ i obratno. Ovoga puta ping uspešno radi. Ako pak pokušamo iz novih kontejnera(3 i 4) da pingujemo kontejnere u staroj mreži (kontejneri 1 i 2) dobićemo grešku.

### Pomeranje kontejnera iz mreže u mrežu i članstvo kontejnera u nekoliko mreža
Kontejneri ne pripadaju uvek nužno samo jednoj mreži, već u zavisnosti od topologije mogu pripadati u nekoliko mreža. Sada možemo da učlanimo kontejnere 1 i 2 u našu "ibismreza" mrežu i tako ostvarimo međusobnu konektivnost između sva četiri nginx kontejnera. Komanda je:

```bash
 $ docker network connect ibismreza kontejner1
 $ docker network connect ibismreza kontejner2
```
> BITNO: ako pogledamo komandu docker inspect kontejner1 ili kontejner2 videćemo da sada ovaj kontejner pripada u dve mreže, "bridge" i "ibismreza"

Pokušajmo sada da međusobno pingujemo kontejnere pomoću zadatih hostname-ova.

Zatvorimo sve Powershell instance i pomoću _one-liner_ komande stopiramo i obrišemo sve prethodne kontejnere:
```bash
 $ docker container stop $(docker container ps -q) && \
   docker container rm $(docker container ps -a -q)
```
___
U sledećoj sekciji pričamo o Storage-u kada budemo radili sa MongoDB-om, veoma zaniljivom NoSQL bazom.
