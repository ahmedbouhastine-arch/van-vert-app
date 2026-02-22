
// This file is the entry point for all AI-related modules.
// It initializes the AI and then loads the flows.

import './init'; // Initialize the AI first

import './flows/check-recency';
import './flows/extract-expiry-date';
import './flows/extract-flight-logs';
import './flows/flag-expiring-documents';
