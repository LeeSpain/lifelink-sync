import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      // Return an HTML page that sends error message to parent window
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Error</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .error { color: #dc3545; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="error">Authorization Failed</h2>
              <p>There was an error during Gmail authorization: ${error}</p>
              <p>You can close this window and try again.</p>
            </div>
            <script>
              // Send error message to parent window
              if (window.opener) {
                window.opener.postMessage({
                  type: 'gmail-oauth-error',
                  error: '${error}'
                }, '*');
                window.close();
              }
            </script>
          </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          ...corsHeaders 
        }
      });
    }

    if (code) {
      // Return HTML page that sends success message to parent window
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Gmail Connected</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .success { color: #28a745; }
              .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #007bff;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 2s linear infinite;
                margin: 0 auto 1rem;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="spinner"></div>
              <h2 class="success">Gmail Connected Successfully!</h2>
              <p>Processing authorization...</p>
            </div>
            <script>
              // Exchange code for tokens via parent window
              if (window.opener) {
                window.opener.postMessage({
                  type: 'gmail-oauth-code',
                  code: '${code}',
                  state: '${state || ''}'
                }, '*');
                
                // Show success and close after short delay
                setTimeout(() => {
                  window.opener.postMessage({
                    type: 'gmail-oauth-success'
                  }, '*');
                  window.close();
                }, 2000);
              }
            </script>
          </body>
        </html>
      `, {
        headers: { 
          'Content-Type': 'text/html',
          ...corsHeaders 
        }
      });
    }

    // No code or error - show generic message
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Callback</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>OAuth Callback</h2>
            <p>No authorization code received. Please try again.</p>
          </div>
        </body>
      </html>
    `, {
      headers: { 
        'Content-Type': 'text/html',
        ...corsHeaders 
      }
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="error">OAuth Error</h2>
            <p>An unexpected error occurred during authorization.</p>
            <p>You can close this window and try again.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'gmail-oauth-error',
                error: 'Unexpected error during authorization'
              }, '*');
              window.close();
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 
        'Content-Type': 'text/html',
        ...corsHeaders 
      }
    });
  }
});