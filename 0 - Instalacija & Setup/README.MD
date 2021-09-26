# Instalacija & Setup

Ovo uputstvo sadrži potrebne korake za instalaciju i podešavanje svih relevantnih software-a. Software-i koje ćemo instalirati zavise od verzije i edicije Windows operativnog sistema, i to su:

* **Docker Runtime** - Runtime za kontejnere
* **MobaXTerm** - Terminal emulator za WinOS sa nekoliko podržanih protokola
* **MongoDBCompas** -  Lightweight Grafički UI za rad sa NoSQL MongoDB bazom podataka

Nakon instalacije software-a, napravićemo i nalog na DockerHub-u za potrebe korišćenja image repozitorijuma tj. registry-ja.

Pre početka instalacije, potrebno je odrediti ediciju operativnog sistema i build version. Najlakši način jeste otvaranje _Command Prompt_-a i izdavanje komande `systeminfo`:

```batch
 #> systeminfo

Host Name:                 ZARKOVIC-N
OS Name:                   Microsoft Windows 10 Pro
OS Version:                10.0.19042 N/A Build 19042
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Member Workstation
... (output je skraćen)
```
Kao što vidimo naša edicija Windows-a je **Windows 10 Pro**. Takođe u sekciji `OS Version` vidimo da je build verzija **Build 19042**.

## Docker Engine Instalacija

Docker je free, open source container engine i container runtime. O detaljima kontejnerizacije u narednoj sekciji. Docker se drugačije instalira u zavisnosti od operativnog sistema, edicije OS-a odnosno od build verzije do build verzije. Na Windows operativnom sistemu suštinski postoje 3 (tehnički 2) moguća načina za instalaciju Docker-a.

  1. Instalacija "Docker for Windows" nad WSLv2(_Windows Subsystems for Linux_) (**najverovatniji način instalacije**)
  2. Instalacija "Docker for Windows" nad Hyper-V
  3. Instalacija "Docker Toolbox-a" nad VirtualBox-om (_deprecated_)

### 1. i 2. Instalacija "Docker for Windows" nad WSLv2 i nad Hyper-V

Ova instalacija moguća je samo ukoliko je operativni sistem:

Za Instalaciju nad WSLv2
* Windows 10 64-bit Home Edition (build 19041 ili veći)
* Windows 10 64-bit Pro Edition (build 19041 ili veći)
* Windows 10 64-bit Enterprise Edition (build 18363 ili veći)
* Windows 10 64-bit Educational Edition (build 18363 ili veći)

Za Instalaciju nad Hyper-V
* Windows 10 64-bit Home Edition - nemam info
* Windows 10 64-bit Pro Edition (build 19041 ili veći)
* Windows 10 64-bit Enterprise Edition (build 18363 ili veći)
* Windows 10 64-bit Educational Edition (build 18363 ili veći)

U suprotnom probati instalaciju pod tačkom 3. - instalacija Docker Toolbox

Kao što vidimo, moja edicija (Microsoft Windows 10 Pro Build 19042) ispunjava uslove za instalaciju na bilo koji od ova dva načina.

Na lokaciji [Docker Installation](https://docs.docker.com/desktop/windows/install/) nalazi se instalacioni link koji je isti i za obe stavke sa detaljnim uputstvom. U toku instalacije, installer će nas pitati da li želimo da koristimo WSL ili Hyper-V kao "backend". U slučaju instalacije nad Hyper-V hipervizorom, moguće je da će biti potrebno podešavanje u okviru BIOS-a za dozvoljavanje virtuelizacije. I u jednom i u drugom slučaju, potrebno je enable-ovati WSL odnosno Hyper-V kako bi docker radio ispravno.

Prilikom download-a potrebno je downloadovati Docker CE odnosno _Comunity Edition_ koji se ne plaća. Postoji i Docker EE (_Enterprise Edition_) koji je plaćena verzija Docker-a za Enterprise korisnike.

Instalacija je relativno jednostavna. Dobijamo jedan windows instalacioni executale fajl (.exe ili .msi), i prolazimo kroz menije na standardni način. Prilikom enable-ovanja Windows Feature-a, moguće je da će biti potrebno čak nekoliko puta i restartovati računar u procesu instalacije, pa je korisno sačuvati sav tekući progres i rad kako se isti ne bi zagubio.

### 3. Instalacija "Docker Toolbox"-a nad VirtualBox VM-om
Kako su od Januara 2020. godine sve edicije WindOS ispod WinOS 10 Out-of-support, i Docker Toolbox je takođe deprecated. Ukoliko neko koristi Win 7 (ne znam što bi), potrebno je da nađe neki repozitorijum gde postoji Docker Toolbox i da isprati uputstva. Za sada pretpostavljamo da smo svi na Windows 10.

---
### Postinstalacioni koraci - Provera instalacije
Kada smo instalirali Docker for Windows, u okviru system tray-a trebalo bi da je naš Docker for Windows pokrenut. Dvoklikom na ikonicu u system tray-u, otvara se dashboard i u donjem levom ćošku bi trebalo da postoji logo (Moby Dock) uokviren u zelenom kvadratu, što bi indikovalo da je Docker u statusu Running.

Drugi način za proveru bio bi taj da u Command Prompt-u ukucamo sledeću komandu:

```batch
 #> docker version
```
Output:
```console
Client:
 Cloud integration: 1.0.17
 Version:           20.10.8
 API version:       1.41
 Go version:        go1.16.6
 Git commit:        3967b7d
 Built:             Fri Jul 30 19:58:50 2021
 OS/Arch:           windows/amd64
 Context:           default
 Experimental:      true

Server: Docker Engine - Community
 Engine:
  Version:          20.10.8
  API version:      1.41 (minimum version 1.12)
  Go version:       go1.16.6
  Git commit:       75249d8
  Built:            Fri Jul 30 19:52:10 2021
  OS/Arch:          linux/amd64
  Experimental:     false
 containerd:
  Version:          1.4.9
  GitCommit:        e25210fe30a0a703442421b0f60afac609f950a3
 runc:
  Version:          1.0.1
  GitCommit:        v1.0.1-0-g4144b63
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```
Verzije se mogu razlikovati od prikazanih. Ovaj Output je indikator da je docker spreman da sa Client-a (koji je Docker CLI) šalje zahteve Engine-u.

Ukolko je prikazan samo deo sa Client-om a u delu Server dobijamo grešku, moguće je da je potreban restart računara. Videti sekciju ispod.

### Potencijalni problemi
Nakon završetka instalacije, Docker bi trebao da nam nudi da restartujemo računar kako bi se konfigurisao WSL i kako bi Serverski deo (Docker Engine) mogao da se pokrene. Nekada greška koja se dešava pre restarta (nemogućnost da vidimo Engine) perzistira iz razloga što su Dockeru tj. WSLv2 potrebni posledni update-i kernela, mada bi installer trebao automatski da ponudi opciju update-a po završenoj instalaciji. Ovi problemi su potencijalni problemi prilikom instalacije nad WSLv2. Problem instalacije nad Hyper-V može biti taj da je Hyper-V disable-ovan ili u Windows Feature-ima ili na nivou BIOS-a. Izguglati potencijalne probleme ili me kontaktirati pa da rešimo problem instalacije pre početka predavanja.

___
## MobaXTerm instalacija

MobaXTerm se može skinuti sa sledećeg [linka](https://mobaxterm.mobatek.net/download.html). Home edition ima određena ograničenja, ali je _free_. Instalacija je relativno jednostavna, dobija se Windows Installer file (.exe ili .msi) koji se pokrene, prođe se kroz menije i odaberu željene opcije (metodom next, next, finish).

### Share-ing Windows path-a
Nakon instalacije pokrenuti MobaXTerm. U opcijama (_Settings_) u tab-u _Terminal_ odeljku _Local Terminal_ bi trebalo čekirati opciju "Use Windows PATH Environment", a za terminal shell odabradi "bash". MobaXTerm je moguće kastomizovati, tako da određene verzije mogu izgledati različito na drugačijim mašinama. Potrebno je proveriti uspešnu instalaciju tako što zatvorimo i ponovo otvorimo MobaXTerm, i pokušamo da pokrenemo novi lokalni terminal klikom na _Start Local Terminal_.

Ukoliko je Docker for Windows uspešno instaliran, i ako su sva podešavanja dobro podešena, moći ćemo da kucamo Docker komande kroz ovaj terminal emulator. Pokušati sa komandom ` $ docker version`. Ukoliko dobijemo isti output kao maločas kroz Powershell podešavanja terminala su dobro urađena.
___

## MongoDB Compass instalacija
MongoDBCompass je grafički UI koji je razvijen za potrebe pregledanja NoSQL MongoDB baze podataka. Ovaj UI će nam koristiti za potrebe pregledanja stanja u bazi kada budemo radili sa istom, tako da ne moramo svaki put gledati stanje baze kroz mongosh CLI shell.

Link za instalaciju je [ovde](https://www.mongodb.com/products/compass), a instalacija se vrši unzip-ovanjem na određenu lokaciju i pokretanjem executable (.exe) fajla. Poželjno je napraviti i desktop shortcut [opciono].

___
## Otvaranje naloga na DockerHub-u

Ovaj korak je opcioni korak, ali ukoliko želimo da publish-ujemo naše custom image na image registry (DockeHub) onda nam je potreban i nalog. Ukoliko želimo samo da povlačimo (_pull_-ujemo) image sa image registry-ja, onda nalog nije potreban.

Username koji biva kreiran na DockerHub-u sadržaće se u identifikatoru repozitorijuma prilikom rada sa kontejnerskim slikama, pa se ne preporučuje neko prekomplikovano korisničko ime (jer to čudo treba posle kucati).

Nakon pravljenja naloga moguće je povezati Docker Engine sa repozitorijumom na jedan od dva načina:

### Način #1 - Docker CLI
Logovanje kroz konzolu. Docker će izbaciti _Warning_ da opcija upisivanja passworda u CLI nije sigurna (zbog mogućnosti history pregleda komandi), već da je bolje specificirati password kroz STDIN (npr. password file).
```bash
 $ docker login -u <Username> -p <Password>
```
### Način #2 - Docker GUI
U System Tray-u, dvoklikom na docker ikonicu, pojaviće se Docker Dashboard, i u gornjem desnom uglu pojavljuje se Sign In opcija. Takođe, starije verzije Docker-a imale su nešto drugačiji Dashboard, pa je logovanje rađeno desni klik na ikonicu u tray-u i u opcijama postoji "Sign In".

Na koji god način da se logujemo, promene se svuda odražavaju. Npr. logovanje kroz konzolu `docker login` komandom, vidi se i u GUI Dashboard-u.
