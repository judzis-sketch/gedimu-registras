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

## 3. App Hosting Inicializavimas

Dabar susiesime jūsų projektą su `Firebase App Hosting`.

1.  Atidarykite terminalą savo projekto pagrindiniame kataloge (tame pačiame, kur yra `package.json`, `src` ir kiti failai).
2.  Įvykdykite šią komandą:
    ```bash
    firebase init apphosting
    ```
3.  Proceso metu `Firebase CLI` užduos jums kelis klausimus:
    *   **Pasirinkite Firebase projektą:** Iš sąrašo pasirinkite tą patį `Firebase` projektą, kurį naudojote iki šiol. **Svarbu:** Sąraše ieškokite projekto pagal jo ID: **`studio-8901194696-cbab9`**. Pavadinimas gali skirtis, bet ID yra unikalus.
    *   **Pasirinkite backend'o regioną:** Pasirinkite arčiausiai jūsų esantį regioną (pvz., `europe-west1` ar panašų).
    *   **Nurodykite GitHub repozitoriją:** Jums reikės prijungti savo `GitHub` paskyrą ir nurodyti repozitoriją, kurioje saugomas šis kodas. `Firebase` naudos šią repozitoriją automatiniam diegimui. Vykdykite ekrane pateikiamas instrukcijas.

Po šių žingsnių, jūsų `Firebase` projektas bus susietas su `GitHub` repozitorija ir paruoštas diegimui. Jūsų projekte jau yra `apphosting.yaml` konfigūracijos failas, todėl jokių papildomų nustatymų daryti nereikia.

## 4. Ką daryti, jei `init` komanda neveikia kaip tikėtasi?

Kartais, ypač jei anksčiau bandėte konfigūruoti `Firebase` šiame kataloge, `firebase init apphosting` komanda gali neparodyti projekto pasirinkimo lentelės arba elgtis keistai.

**Pirmiausia, išvalykite seną konfigūraciją:**
1. Patikrinkite, ar jūsų pagrindiniame projekto kataloge yra failai pavadinimu `.firebaserc` arba `firebase.json`.
2. Jei šie failai egzistuoja, **ištrinkite juos**. Tai leis `Firebase CLI` pradėti procesą nuo nulio.

**Tada, patikrinkite prisijungimą ir projektus:**
1.  Priverstinai prisijunkite iš naujo, kad įsitikintumėte, jog naudojate teisingą Google paskyrą:
    ```bash
    firebase login --reauth
    ```
2.  Patikrinkite, ar projektas matomas, įvykdę:
    ```bash
    firebase projects:list
    ```
    Sąraše turėtumėte matyti projektą su ID **`studio-8901194696-cbab9`**.

3.  Kai įsitikinsite, kad viskas gerai, vėl vykdykite `firebase init apphosting`. Dabar turėtumėte matyti interaktyvius pasirinkimus.


## 5. Kodo Įkėlimas į GitHub

Įsitikinkite, kad visi jūsų naujausi pakeitimai yra įkelti (`pushed`) į `GitHub` repozitorijos pagrindinę (`main` arba `master`) šaką.

```bash
git add .
git commit -m "Pabaigti programos pakeitimai"
git push origin main
```

## 6. Diegimas

`Firebase App Hosting` yra sukonfigūruotas taip, kad automatiškai įdiegtų naują versiją kaskart, kai įkeliate pakeitimus į pagrindinę `GitHub` šaką.

Po to, kai įkelsite kodą (`git push`), galite stebėti diegimo procesą savo `Firebase` projekto konsolėje, `App Hosting` skiltyje. Kai diegimas bus baigtas, jūsų programa bus pasiekiama viešu `Firebase` suteiktu adresu.

**Viskas!** Jūsų programa dabar veikia `Firebase` infrastruktūroje. Visi būsimi pakeitimai, kuriuos įkelsite į `GitHub`, bus automatiškai įdiegiami.
