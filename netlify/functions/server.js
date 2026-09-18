/**
 * Track 24 — Netlify Serverless Function Adapter
 * Wraps the Express app as a Netlify serverless handler.
 * Compatible with Express 5 and serverless-http v3.
 */
import serverless from 'serverless-http';
import app from '../../server.js';

// serverless-http wraps express and handles the event/context → req/res translation
const handler = serverless(app, {
  // Strip the Netlify function prefix so Express routes match correctly
  // e.g. /.netlify/functions/server/api/sessions → /api/sessions
  request(req) {
    // Netlify passes the original path via headers — preserve it
    return req;
  }
});

export { handler };
