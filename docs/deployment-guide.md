# Diegimo į Firebase App Hosting Instrukcija

Šios instrukcijos padės jums įdiegti savo `Next.js` programą į `Firebase App Hosting`. Tai leis jūsų programai veikti `Firebase` infrastruktūroje, užtikrinant sklandų visų dalių (tiek vartotojo sąsajos, tiek serverio logikos) veikimą kartu.

## 1. Būtinos programos

Įsitikinkite, kad jūsų kompiuteryje yra įdiegta:

1.  **Node.js**: [Atsisiųsti ir įdiegti Node.js](https://nodejs.org/en) (rekomenduojama LTS versija).
2.  **Firebase CLI**: Tai yra komandinės eilutės įrankis, skirtas valdyti `Firebase` projektus. Jei dar neturite, įdiekite jį globaliai, atidarę terminalą (arba `Command Prompt`) ir įvykdę komandą:
    ```bash
    npm install -g firebase-tools
    ```

## 2. Prisijungimas prie Firebase

Prieš tęsiant, jums reikia prisijungti prie savo `Firebase` paskyros per komandinę eilutę:

```bash
firebase login
```
Ši komanda atidarys naršyklės langą, kuriame turėsite patvirtinti savo tapatybę. Įsitikinkite, kad jungiatės su ta pačia Google paskyra, kurią naudojate `Firebase Studio`.

## 3. GitHub Repozitorijos Paruošimas (Būtinas žingsnis!)

`Firebase App Hosting` yra neatsiejamai susijęs su `GitHub`. Automatinis diegimas veikia stebėdamas jūsų `GitHub` repozitoriją.

**Prieš tęsiant, įsitikinkite, kad:**

1.  **Sukūrėte `GitHub` repozitoriją:** Jei dar neturite, nueikite į `github.com` ir sukurkite naują repozitoriją šiam projektui.
2.  **Įkėlėte kodą:** Visi jūsų programos failai turi būti įkelti (`pushed`) į tą repozitoriją. Pavyzdys, kaip tai padaryti:
    ```bash
    # Pridėkite visus failus
    git add .
    # Padarykite "commit"
    git commit -m "Pabaigti programos pakeitimai"
    # Nusiųskite pakeitimus į GitHub
    git push origin main
    ```

**Tik tada, kai jūsų kodas yra `GitHub`, galite pereiti prie kito žingsnio.**

## 4. App Hosting Inicializavimas

Dabar susiesime jūsų `Firebase` projektą su `GitHub` repozitorija.

1.  Atidarykite terminalą savo projekto pagrindiniame kataloge.
2.  Įvykdykite šią komandą:
    ```bash
    firebase init apphosting
    ```
3.  Proceso metu `Firebase CLI` užduos jums kelis klausimus:
    *   **Pasirinkite Firebase projektą:** Iš sąrašo pasirinkite tą patį `Firebase` projektą, kurį naudojote iki šiol. **Svarbu:** Sąraše ieškokite projekto pagal jo ID: **`studio-8901194696-cbab9`**. Pavadinimas gali skirtis, bet ID yra unikalus.
    *   **Pasirinkite backend'o regioną:** Pasirinkite arčiausiai jūsų esantį regioną (pvz., `europe-west1`).
    *   **Nurodykite GitHub repozitoriją:** Kai paklaus **"Set up a GitHub repository for continual deployment?"**, atsakykite `Yes`. Vykdykite ekrane pateikiamas instrukcijas – naršyklėje turėsite patvirtinti prieigą prie `GitHub` ir pasirinkti repozitoriją, kurią paruošėte 3 žingsnyje.

Po šių žingsnių, jūsų `Firebase` projektas bus susietas su `GitHub` repozitorija ir paruoštas diegimui.

## 5. Ką daryti, jei `init` komanda nepasiūlė susieti su GitHub?

Kartais, ypač jei anksčiau bandėte konfigūruoti `Firebase` šiame kataloge, `firebase init apphosting` komanda gali praleisti `GitHub` susiejimo klausimą.

**Sprendimas – išvalykite seną konfigūraciją ir bandykite iš naujo:**
1.  **Ištrinkite konfigūracijos failus.** Tai leis `Firebase CLI` pradėti procesą nuo nulio.
    ```bash
    rm -f firebase.json .firebaserc
    ```
2.  **Paleiskite `init` komandą iš naujo.** Dabar turėtumėte matyti visus interaktyvius pasirinkimus, įskaitant projekto ir `GitHub` pasirinkimą.
    ```bash
    firebase init apphosting
    ```

## 6. Diegimas

`Firebase App Hosting` yra sukonfigūruotas taip, kad automatiškai įdiegtų naują versiją kaskart, kai įkeliate pakeitimus į pagrindinę `GitHub` šaką.

Galite stebėti diegimo procesą savo `Firebase` projekto konsolėje, `App Hosting` skiltyje. Kai diegimas bus baigtas, jūsų programa bus pasiekiama viešu `Firebase` suteiktu adresu.

**Viskas!** Jūsų programa dabar veikia `Firebase` infrastruktūroje. Visi būsimi pakeitimai, kuriuos įkelsite į `GitHub`, bus automatiškai įdiegiami.
