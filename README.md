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