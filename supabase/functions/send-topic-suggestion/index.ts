import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TopicSuggestionRequest {
  name: string;
  email: string;
  suggestion: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, suggestion }: TopicSuggestionRequest = await req.json();
    const gmailEmail = Deno.env.get('GMAIL_EMAIL');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailEmail || !gmailPassword) {
      throw new Error('Gmail credentials not configured. Please set GMAIL_EMAIL and GMAIL_APP_PASSWORD');
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
    });

    // Compose HTML bodies
    const ownerHtml = `
        <h1>New Topic Suggestion</h1>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Suggested Topic:</strong></p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${suggestion.replace(/\n/g, '<br>')}
        </div>
        <hr>
        <p><em>This suggestion was sent from BlockFeed's topic suggestion form.</em></p>`;

    const userHtml = `
        <h1>Thank you for your topic suggestion, ${name}!</h1>
        <p>We appreciate your input and will carefully consider your suggestion for inclusion in our feed.</p>
        <p><strong>Your suggestion:</strong></p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${suggestion.replace(/\n/g, '<br>')}
        </div>
        <p>Best regards,<br>The BlockFeed Team</p>`;

    try {
      // Send to site owner
      await transporter.sendMail({
        from: `"BlockFeed Topics" <${gmailEmail}>`,
        to: "asmitgoswami27@gmail.com",
        subject: `New Topic Suggestion from ${name}`,
        html: ownerHtml,
      });

      // Send confirmation to user
      await transporter.sendMail({
        from: `"BlockFeed" <${gmailEmail}>`,
        to: email,
        subject: "Thank you for your topic suggestion!",
        html: userHtml,
      });
    } catch (emailError) {
      console.error('SMTP Error (topic suggestion):', emailError);
      throw new Error(`SMTP Error: ${emailError instanceof Error ? emailError.message : 'Failed to send topic suggestion email'}`);
    }

    console.log("Topic suggestion emails sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-topic-suggestion function:", error);
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
