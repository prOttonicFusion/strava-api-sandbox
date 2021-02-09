import axios from "axios";
import * as express from "express";
import * as buildUrl from "build-url";
import * as querystring from "querystring";
import * as moment from "moment";

const fs = require("fs");
require("dotenv").config();

const STRAVA_OAUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_URL = "https://www.strava.com/api/v3";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const BASE_URL = "http://localhost:3000";

const CALLBACK_URL = `${BASE_URL}/get_token`;
const SCOPES = ["profile:read_all", "activity:read_all"];
const STATE = "prottonic";

interface IStravaAccessToken {
  access_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
  refresh_token: string;
  userid: string;
  athlete?: {
    id: string;
  };
}

const getAuthUrl = async (state: string): Promise<string> => {
  return buildUrl(STRAVA_OAUTH_URL, {
    queryParams: {
      response_type: "code",
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: CALLBACK_URL,
      state,
    },
  });
};

const retrieveAccessToken = async (code: string): Promise<IStravaAccessToken> => {
  const tokenRequestBody = {
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
  };

  return await post<IStravaAccessToken>(STRAVA_TOKEN_URL, tokenRequestBody);
};

const refreshAccessToken = async (
  refreshToken: string
): Promise<IStravaAccessToken> => {
  const refreshRequestBody = {
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshToken,
  };

  return await post<IStravaAccessToken>(STRAVA_TOKEN_URL, refreshRequestBody);
};

const getActivities = async (
  accessToken: string,
  startdate: moment.Moment | Date | string,
  enddate: moment.Moment | Date | string,
  page: number
): Promise<any> => {
  const workoutsUrl = buildUrl(STRAVA_API_URL, {
    path: "/athlete/activities",
    queryParams: {
      before: moment(enddate).unix().toString(),
      after: moment(startdate).unix().toString(),
      page: page.toString(),
    },
  });

  return get<any>(workoutsUrl, accessToken);
};

const post = async <T>(url, body): Promise<T> => {
  const response = await axios.post<T>(url, querystring.stringify(body), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};

const get = async <T>(url, accessToken: string): Promise<T> => {
  const result = await axios.get<T>(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  console.log(result)

  return result.data;
};

let accessToken = undefined

express()
  .use((req, res, next) => {
    console.log(req.path);
    next();
  })
  .post("/ping", (req, res, next) => {
    console.log(req.body);
    res.end("ping");
  })
  .get("/", async (req, res, next) => {
    // Redirect user to Strava authentication page

    const authUrl = await getAuthUrl(STATE);
    console.log(authUrl);
    res.redirect(authUrl);
  })
  .get("/get_token", async (req, res, next) => {
    // Authentication page redirects here
    // On access granted: request contains 'code' & 'scope', else: contains 'error=access_denied'
    // https://developers.strava.com/docs/authentication/

    const { code, scope, error } = req.query;

    if (error) {
      console.log("Error:", error);
      res.end(error);
    } else {
      console.log("code:", code);
      console.log("scope:", scope);

      const tokenResult = await retrieveAccessToken(code);
      accessToken = tokenResult.access_token

      console.log("access-token:", accessToken);

      res.redirect(`${BASE_URL}/get_activities`);
    }
  })
  .get("/get_activities", async (req, res, next) => {
    const startDate = '2020-01-01'
    const endDate = '2021-02-09'

    const activities = await getActivities(accessToken, startDate, endDate, 1);

    res.json(activities)
  })
  .listen(3000);
