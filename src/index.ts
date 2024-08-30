import crypto from "node:crypto";
import querystring from "node:querystring";
import { cookie } from "@elysiajs/cookie";
import { Elysia } from "elysia";

const LMS_URL = "https://canvas.dev.cdl.ucf.edu";
const LTI_URL = "http://localhost:3000";
const LMS = "canvas";
const APP_LTI_NAME = "UDOIT 3.x";
const ADMIN_LTI_NAME = "UDOIT 3.x Admin";

type Output = import("./types").Output;

const app = new Elysia()
  .use(cookie())
  .get("/", () => "Hello Elysia")
  .get("/hello", async () => {
    const API_KEY =
      "5DpMzvzrQqeS31rYtxSGfOzL8Nfe46FKu9ATATDHG30MKaKb5ATos6B781rQXkft";

    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    };

    const url = `${LMS_URL}/api/v1/courses`;

    console.log("making request to", url);
    const response = await fetch(url, { headers, method: "GET" });
    const data = await response.json();
    console.log("data", data);
    return data;
  })
  .get("/lti/config", ({ query }) => {
    const baseDomain = LMS_URL.replace("https://", "");
    const platform = LMS === "canvas" ? "canvas.instructure.com" : "d2l.com";

    const customAppName = query.tool_title || undefined;
    const defaultValue = query.default || undefined;

    /** @type {Output}*/
    const output: Output = {
      title: APP_LTI_NAME,
      scopes: [],
      public_jwk: [],
      description: "User settings for UDOIT 3.x",
      public_jwk_url: "https://canvas.instructure.com/api/lti/security/jwks",
      target_link_uri: `${LTI_URL}/dashboard`,
      oidc_initiation_url: `${LTI_URL}/lti/authorize`,

      extensions: [
        {
          domain: baseDomain,
          tool_id: "cidilabs_udoit3",
          platform: platform,
          settings: {
            text: APP_LTI_NAME,
            platform: platform,
            placements: [
              {
                text: customAppName || APP_LTI_NAME,
                placement: "course_navigation",
                message_type: "LtiResourceLinkRequest",
                target_link_uri: `${LTI_URL}/dashboard`,
                visibility: "admins",
                enabled: true,
                default: defaultValue || "disabled",
              },
              {
                text: ADMIN_LTI_NAME,
                placement: "account_navigation",
                message_type: "LtiResourceLinkRequest",
                target_link_uri: `${LTI_URL}/admin`,
                enabled: true,
              },
            ],
          },
          privacy_level: "anonymous",
        },
      ],
    };

    output.custom_fields = {
      lms_id: "canvas",
      lms_user_id: "$Canvas.user.id",
      lms_course_id: "$Canvas.course.id",
      lms_account_id: "$Canvas.account.id",
      lms_api_domain: "$Canvas.api.domain",
    };

    return output;
  })
  .get(
    "/lti/authorize",
    ({ query, error, cookie: { user }, setCookie, redirect }) => {
      // Extract parameters from the request
      const {
        iss,
        login_hint,
        target_link_uri,
        client_id,
        deployment_id,
        canvas_region,
        canvas_environment,
      } = query;

      // Validate the issuer
      const validIssuers = [
        "https://canvas.instructure.com",
        "https://canvas.beta.instructure.com",
        "https://canvas.test.instructure.com",
      ];

      if (!iss) return error(400, "Missing issuer");

      if (!validIssuers.includes(iss)) {
        return error(400, "Invalid issuer");
      }

      // Validate other required parameters
      if (!login_hint || !client_id) {
        return error(400, "Missing required parameters");
      }

      // Generate a state parameter for security
      const state = crypto.randomBytes(16).toString("hex");
      // Generate a nonce for replay protection
      const nonce = crypto.randomBytes(16).toString("hex");

      // Store state and nonce in cookies
      setCookie("state", state);
      setCookie("nonce", nonce);

      // Prepare the response
      const responseParams = {
        scope: "openid", // Required for LTI 1.3
        response_type: "id_token",
        client_id: client_id,
        redirect_uri: `${LTI_URL}/auth`, // Replace with your actual redirect URI
        login_hint: login_hint,
        state: state,
        nonce: nonce,
        prompt: "none", // Indicates that Canvas should not prompt the user if a session already exists
      };

      // If target_link_uri was provided, include it in the response
      if (target_link_uri) {
        responseParams.lti_message_hint = JSON.stringify({ target_link_uri });
      }

      // Construct the authorization redirect URL
      const authorizationEndpoint = `${iss}/api/lti/authorize_redirect`;
      const redirectUrl = `${authorizationEndpoint}?${querystring.stringify(responseParams)}`;

      // Redirect the user to Canvas for authentication
      redirect(redirectUrl);

      // Log additional information (optional)
      console.log(
        `Login initiation from ${canvas_environment} environment in ${canvas_region} region`,
      );
      console.log(`Deployment ID: ${deployment_id}`);
    },
  )

  .listen(3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
