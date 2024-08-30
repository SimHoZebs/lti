export interface ServerConfig {
  BASE_URL: string;
  APP_LTI_NAME: string;
  ADMIN_LTI_NAME: string;
}

export type Output = {
  title: string;
  scopes: unknown[];
  public_jwk: unknown[];
  description: string;
  public_jwk_url: string;
  target_link_uri: string;
  oidc_initiation_url: string;

  extensions: {
    domain: string;
    tool_id: string;
    platform: string;
    privacy_level: string;

    settings: {
      text: string;
      platform: string;

      placements: {
        text: string;
        placement: string;
        message_type: string;
        target_link_uri: string;
        visibility?: string;
        enabled: boolean;
        default?: string;
      }[];
    };
  }[];

  custom_fields?: {
    lms_id: string;
    lms_user_id: string;
    lms_course_id: string;
    lms_account_id: string;
    lms_api_domain: string;
  };
};
