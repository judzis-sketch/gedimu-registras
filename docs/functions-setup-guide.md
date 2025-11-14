# Firebase Functions: Automatinių Pranešimų Siuntimo Instrukcija

Šios instrukcijos padės jums sukurti ir įdiegti `Firebase Cloud Function`, kuri automatiškai siųs naršyklės pranešimus (push notifications) darbuotojams, kai jiems bus priskirtas naujas gedimas.

## 1. Būtinos programos

Įsitikinkite, kad jūsų kompiuteryje yra įdiegta:

1.  **Node.js**: [Atsisiųsti ir įdiegti Node.js](https://nodejs.org/en) (rekomenduojama LTS versija).
2.  **Firebase CLI**: Tai yra komandinės eilutės įrankis, skirtas valdyti `Firebase` projektus. Įdiekite jį globaliai, atidarę terminalą (arba `Command Prompt`) ir įvykdę komandą:
    ```bash
    npm install -g firebase-tools
    ```

## 2. Prisijungimas prie Firebase

Prieš tęsiant, jums reikia prisijungti prie savo `Firebase` paskyros per komandinę eilutę:

```bash
firebase login
```
Ši komanda atidarys naršyklės langą, kuriame turėsite patvirtinti savo tapatybę.

## 3. Firebase Functions Inicializavimas

Dabar paruošime jūsų projektą `Firebase Functions` naudojimui.

1.  Atidarykite terminalą savo projekto pagrindiniame kataloge (tame pačiame, kur yra `package.json`, `src` ir kiti failai).
2.  Įvykdykite šią komandą:
    ```bash
    firebase init functions
    ```
3.  Proceso metu jūsų paklaus kelių klausimų. Pasirinkite šiuos atsakymus:
    *   **What language would you like to use to write Cloud Functions?** -> `TypeScript`
    *   **Do you want to use ESLint to catch probable bugs and enforce style?** -> `Yes` (Paspauskite "Enter")
    *   **File functions/package.json already exists. Overwrite?** -> `No` (Jei paklaus)
    *   **File functions/.eslintrc.js already exists. Overwrite?** -> `No` (Jei paklaus)
    *   **File functions/tsconfig.json already exists. Overwrite?** -> `No` (Jei paklaus)
    *   **Do you want to install dependencies with npm now?** -> `Yes` (Paspauskite "Enter")

Po šių žingsnių jūsų projekte atsiras naujas katalogas `functions`, kuriame bus visa serverio kodo struktūra.

## 4. Funkcijos Kodo Įdiegimas

Dabar įdėsime pačios funkcijos kodą.

1.  Atidarykite failą `functions/src/index.ts`.
2.  Ištrinkite visą jame esantį pavyzdinį kodą ir įklijuokite šį:

    ```typescript
    import * as functions from "firebase-functions";
    import * as admin from "firebase-admin";

    // Inicializuojame Firebase Admin SDK
    admin.initializeApp();

    /**
     * Ši funkcija yra automatiškai paleidžiama (trigger), kai "issues"
     * kolekcijoje bet kuris dokumentas yra atnaujinamas.
     */
    export const sendNotificationOnAssignment = functions.firestore
      .document("issues/{issueId}")
      .onUpdate(async (change, context) => {
        // Gauname duomenis prieš ir po atnaujinimo
        const beforeData = change.before.data();
        const afterData = change.after.data();

        // Tikriname, ar gedimas buvo priskirtas darbuotojui (t.y. assignedTo laukas
        // buvo tuščias, o dabar turi reikšmę).
        if (beforeData.assignedTo === "" && afterData.assignedTo !== "") {
          const workerId = afterData.assignedTo;
          const issueDescription = afterData.description;
          const issueAddress = afterData.address;

          functions.logger.log(
            `Gedimas priskirtas darbuotojui ${workerId}.`,
            `Aprašymas: ${issueDescription}`
          );

          // Gauname darbuotojo dokumentą iš "employees" kolekcijos
          const workerRef = admin.firestore().doc(`employees/${workerId}`);
          const workerDoc = await workerRef.get();

          if (!workerDoc.exists) {
            functions.logger.error("Darbuotojo dokumentas nerastas:", workerId);
            return null;
          }

          const workerData = workerDoc.data();
          const fcmToken = workerData?.fcmToken;

          if (!fcmToken) {
            functions.logger.warn(
              `Darbuotojas ${workerId} neturi FCM rakto (token). Pranešimas nesiunčiamas.`
            );
            return null;
          }

          // Sukuriame pranešimo turinį
          const payload = {
            notification: {
              title: "Jums priskirtas naujas gedimas!",
              body: `Adresas: ${issueAddress}. Aprašymas: ${issueDescription.substring(0, 100)}...`,
              click_action: "/dashboard/my-tasks?role=worker", // Nukreips į užduočių puslapį
              icon: "/favicon.ico", // Pranešimo ikona
            },
          };

          functions.logger.log("Siunčiamas pranešimas į raktą:", fcmToken);

          // Išsiunčiame pranešimą per Firebase Cloud Messaging
          try {
            const response = await admin.messaging().sendToDevice(fcmToken, payload);
            functions.logger.log("Pranešimas sėkmingai išsiųstas:", response);
          } catch (error) {
            functions.logger.error("Klaida siunčiant pranešimą:", error);
          }
        }
        return null;
      });
    ```

## 5. Funkcijos Įdiegimas į Serverį

Dabar, kai kodas paruoštas, jį reikia įdiegti į `Firebase` serverius.

1.  Grįžkite į terminalą savo projekto pagrindiniame kataloge.
2.  Įvykdykite šią komandą:
    ```bash
    firebase deploy --only functions
    ```
3.  Palaukite kelias minutes, kol diegimo procesas bus baigtas.

**Viskas!** Po sėkmingo įdiegimo, jūsų sistema bus pilnai veikianti. Kai administratorius priskirs naują gedimą darbuotojui, šis savo įrenginyje (jei leido gauti pranešimus) pamatys automatinį pranešimą.