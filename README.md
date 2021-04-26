# Asclepius - a modern serverless temperature taking web app

Temperature taking with Firebase

## Get started

Install the dependencies...

```bash
cd svelte-app
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

## Security Design

This application has been carefully designed to protect user information to the largest degree with industry good practises.

### Database

This application uses Firebase Cloud Firestore. The security of the database is handled entirely in the server as per Firebase's design. Some basic principles applies:

1. Individual users can read/write to their OWN temperature records ONLY.
2. Superusers can read/write to ALL temperature records and to ALL mappings of name and phone number. This account should be protected to a large degree.
3. Ultrausers (aka developer account holders) can read/write to ALL parts of the database, including security rules. Hence, it should be protected to the highest degree through compulsory 2FA on the Google Account level.
4. Anonymous/Public users have NO access to any part of the database.

### Login

The data is protected behind a robust login and authentication systems through a phone number and OTP combination, ensuring that all accounts enjoy 2FA levels of security. Phone numbers are the most anonymised authentication method available with a Firebase backend, to ensure user privacy.

### Data Handling and Collection

The application **only** collects the following information

1. Mobile phone numbers (for user authentication and identification ONLY)
2. Name (for superusers to map/correspond the phone number to name during collation)
3. Temperatures corresponding to phone numbers

### Ultrauser handling

Ultrausers **MUST** be protected with 2nd factor authentication to ensure that data breaches do not occur at the Ultrauser level.

### Auditability of Source Code

The source code is publicly auditable on this website, Github. Infosec researchers are welcome to audit this source code.

## Building and running in production mode

To create an optimised version of the app:

```bash
npm run build
```

You can run the newly built app with `npm run start`. This uses [sirv](https://github.com/lukeed/sirv), which is included in your package.json's `dependencies` so that the app will work when you deploy to platforms like [Heroku](https://heroku.com).
