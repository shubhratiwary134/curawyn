# Privacy Policy — YouTube Feed Control

YouTube Feed Control is committed to 100% user privacy and data sovereignty.

## 1. No External Servers or Telemetry
- **No Backend**: There are no remote backend servers, tracking domains, or analytics services.
- **No Analytics / Telemetry**: We collect zero analytics, metrics, crash telemetry, or usage data.
- **No Remote Code**: All code executes directly from the locally installed extension bundle adhering to Chrome Manifest V3 requirements.

## 2. Local Storage
- All user configurations, whitelist choices, duration limits, and blacklist records are stored locally on your machine using `chrome.storage.local`.
- Video classification caches and session impression records are stored in browser-local IndexedDB (`idb`) with automatic TTL expiration.

## 3. Network Calls
The extension makes **only two possible network requests**:
1. **Same-Origin Metadata Requests (`https://www.youtube.com/*`)**:
   Used solely to fetch public player microformats from YouTube to classify video genres locally.
2. **Optional YouTube Data API v3 (`https://www.googleapis.com/*`)**:
   Used **only** if you explicitly provide your own private API key in Advanced Settings. The extension requests runtime host permission (`optional_host_permissions`) only when enabled.

## 4. Open Source
The extension source code is open source under the MIT License and open for public review and audit.
