export type GoogleCodeResponse = {
  code?: string;
  error?: string;
};

export type GoogleCodeClient = {
  requestCode: () => void;
};

export type GoogleAccountsOAuth = {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode: "popup";
    callback: (response: GoogleCodeResponse) => void;
  }) => GoogleCodeClient;
};

export type GoogleCredentialResponse = {
  credential?: string;
};

export type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  prompt: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
        oauth2?: GoogleAccountsOAuth;
      };
    };
  }
}
