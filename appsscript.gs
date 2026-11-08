// ==========================================

{
  "timeZone": "Europe/Rome",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "People",
        "serviceId": "peopleapi",
        "version": "v1"
      },
      {
        "userSymbol": "Calendar",
        "serviceId": "calendar",
        "version": "v3"
      },
      {
        "userSymbol": "Sheets",
        "serviceId": "sheets",
        "version": "v4"
      },
      {
        "userSymbol": "YouTube",
        "serviceId": "youtube",
        "version": "v3"
      },
      {
        "userSymbol": "Drive",
        "serviceId": "drive",
        "version": "v3"
      }
    ]
  },
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/script.projects.readonly",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.storage",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/contacts.readonly",
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly"
  ]
}

