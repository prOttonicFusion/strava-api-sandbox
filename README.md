# Strava API Sandbox

## Setup
1. Create a Strava account at https://www.strava.com/register
1. Create a new app at https://www.strava.com/settings/api with the following settings:
    - Callback URL: `localhost:3000`
1. Create a file called `.env` in the project root and add the lines
    ```
    CLIENT_ID=***
    CLIENT_SECRET=***
    ```
    with `***` replaced with the client id and secret, respectively, copied from https://www.strava.com/settings/api.
1. The sandbox is now accessible through http://localhost:3000/

## Usage
When navigating to http://localhost:3000/, the user should be redirected to the Strava Authorization site. After a successful sign-in, the user is redirected back to the sandbox site and a query is made to the the activities API endpoint. If everything is set up correctly, you should see some returned activity data both in the browser and on the command line.

To test subscriptions related stuff, set up the [callback server](https://github.com/prottonicfusion/strava-webhooks) and add the ngrok url to `.env` as  the `NOTIFICATION_URL`.