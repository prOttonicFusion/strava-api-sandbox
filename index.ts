import axios from "axios";
import * as express from "express";
import * as buildUrl from "build-url";
import * as querystring from "querystring";
import * as moment from "moment";
import { IStravaAccessToken, IStravaRawWorkouts, IStravaSubscriptionData } from "./types";

const JSONbig = require('json-bigint');

const fs = require("fs");
require("dotenv").config();

const STRAVA_OAUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_URL = "https://www.strava.com/api/v3";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const NOTIFICATION_URL = process.env.NOTIFICATION_URL;

const BASE_URL = "http://localhost:3000";

const CALLBACK_URL = `${BASE_URL}/get_token`;
const SCOPES = ["profile:read_all", "activity:read_all"];
const STATE = "prottonic";

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

const retrieveAccessToken = async (
  code: string
): Promise<IStravaAccessToken> => {
  const tokenRequestBody = {
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
  };

  return await post<IStravaAccessToken>(STRAVA_TOKEN_URL, tokenRequestBody);
};

const getActivities = async (
  accessToken: string,
  startdate: moment.Moment | Date | string,
  enddate: moment.Moment | Date | string,
  page: number
): Promise<IStravaRawWorkouts> => {
  const workoutsUrl = buildUrl(STRAVA_API_URL, {
    path: "/athlete/activities",
    queryParams: {
      before: moment(enddate).unix().toString(),
      after: moment(startdate).unix().toString(),
      page: page.toString(),
    },
  });

  return get<IStravaRawWorkouts>(workoutsUrl, accessToken);
};

const getStreamsForActivity = async (accessToken: string, activityId: string): Promise<any> => {
  const streamUrl = buildUrl(STRAVA_API_URL, {
    path: `/activities/${activityId}/streams`,
    queryParams: {
      key_by_type: 'true',
      keys: ['time', 'distance', 'altitude', 'velocity_smooth', 'heartrate', 'cadence', 'watts', 'temp', 'moving', 'grade_smooth'],
    },
  })

  console.log(streamUrl);

  const result = await axios.get<any>(streamUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return result.data;
}

const createSubscription = async (): Promise<any> => {
  const subscriptionUrl = buildUrl(STRAVA_API_URL, {
    path: "push_subscriptions",
  });

  const subRequest = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    callback_url: NOTIFICATION_URL,
    verify_token: "STRAVA",
  };

  const subscriptionResponse = await post<any>(subscriptionUrl, subRequest);

  return subscriptionResponse;
};

const getSubscriptions = async (accessToken: string): Promise<IStravaSubscriptionData[]> => {
  const url = buildUrl(STRAVA_API_URL, { path: "push_subscriptions" });

  const result = await axios.get<IStravaSubscriptionData[]>(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    },
  });

  return result.data;
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
    transformResponse: data => JSONbig.parse(data, (key, value) => {
        if (key === 'id') {
            return value.toString();
        }
        return value;
      })
  });

  console.log(result);

  return result.data;
};

let accessToken = undefined;

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
      accessToken = tokenResult.access_token;
      console.log("access-token:", accessToken);
      res.redirect(`${BASE_URL}/get_activities`);
      // res.redirect(`${BASE_URL}/get_activity_streams`);
      // res.redirect(`${BASE_URL}/subscribe`);
      // res.redirect(`${BASE_URL}/get_subscriptions`);
    }
  })
  .get("/get_activities", async (req, res, next) => {
    // Fetch some activity data for the authenticated user
    const startDate = "2021-01-01";
    const endDate = "2021-03-03";

    const activities = await getActivities(accessToken, startDate, endDate, 1);

    res.json(activities);
  })
  .get("/get_activity_streams", async (req, res, next) => {
    // Fetch the streams related to a specific activity
    const activityId = '4877152060';

    const streams = await getStreamsForActivity(accessToken, activityId);

    console.log(streams);

    res.end()
  })
  .get("/subscribe", async (req, res, next) => {
    const subscriptionDetails = await createSubscription();
    res.json(subscriptionDetails);
  })
  .get("/get_subscriptions", async (req, res, next) => {
    const subscriptionDetails = await getSubscriptions(accessToken);
    res.json(subscriptionDetails);
  })
  .listen(3000);
