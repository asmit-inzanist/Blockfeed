import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, message }: ContactEmailRequest = await req.json();
    const gmailEmail = Deno.env.get('GMAIL_EMAIL');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailEmail || !gmailPassword) {
      throw new Error('Gmail credentials not configured. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD');
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 587,
        tls: true,
        auth: {
          username: gmailEmail,
          password: gmailPassword,
        },
      },
    });

    // Compose HTML bodies
    const ownerHtml = `
        <h1>New Contact Form Message</h1>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <hr>
        <p><em>This message was sent from the BlockFeed contact form.</em></p>`;

    const userHtml = `
        <h1>Thank you for contacting us, ${name}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p>Best regards,<br>The BlockFeed Team</p>`;

    try {
      // Send to site owner
      await client.send({
        from: `"BlockFeed Contact" <${gmailEmail}>`,
        to: "asmitgoswami27@gmail.com",
        subject: `New Contact Form Message from ${name}`,
        html: ownerHtml,
        content: "text/html",
      });

      // Send confirmation to user
      await client.send({
        from: `"BlockFeed" <${gmailEmail}>`,
        to: email,
        subject: "Thank you for contacting BlockFeed!",
        html: userHtml,
        content: "text/html",
      });

      await client.close();
    } catch (emailError) {
      console.error('SMTP Error (contact email):', emailError);
      throw new Error(`SMTP Error: ${emailError instanceof Error ? emailError.message : 'Failed to send contact email'}`);
    }

    console.log("Contact emails sent successfully via Gmail SMTP");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);